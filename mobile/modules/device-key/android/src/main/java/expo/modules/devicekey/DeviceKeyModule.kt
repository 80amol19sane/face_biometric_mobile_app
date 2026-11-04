package expo.modules.devicekey

import android.os.Build
import android.os.SystemClock
import android.provider.Settings
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import android.security.keystore.StrongBoxUnavailableException
import android.util.Base64
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.KeyFactory
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.Signature
import java.security.spec.ECGenParameterSpec
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

private const val KEYSTORE = "AndroidKeyStore"
private const val CURVE = "secp256r1"
private const val SIGNATURE_ALGORITHM = "SHA256withECDSA"
private const val SECRET_ALIAS = "fb_queue_aes"
private const val CIPHER = "AES/GCM/NoPadding"
private const val TAG_BITS = 128

class KeyMissingException(alias: String) :
  CodedException("ERR_KEY_MISSING", "No device key named '$alias'", null)

/**
 * An ECDSA P-256 key pair that lives in the Android Keystore. The private key never leaves the
 * secure hardware; JS only gets the public key (SPKI DER, base64) and signatures (DER, base64),
 * which is what the face_biometric backend verifies.
 *
 * It also keeps one AES-256-GCM key in the same place to encrypt the offline scan queue, and reports
 * the phone's running time and boot count, which a changed clock cannot move.
 */
class DeviceKeyModule : Module() {
  private val keyStore: KeyStore by lazy { KeyStore.getInstance(KEYSTORE).apply { load(null) } }

  override fun definition() = ModuleDefinition {
    Name("DeviceKey")

    Function("hasKey") { alias: String -> keyStore.containsAlias(alias) }

    Function("createKey") { alias: String ->
      if (keyStore.containsAlias(alias)) keyStore.deleteEntry(alias)
      generate(alias)
      publicKey(alias)
    }

    Function("getPublicKey") { alias: String -> publicKey(alias) }

    Function("sign") { alias: String, payload: String ->
      val signature = Signature.getInstance(SIGNATURE_ALGORITHM)
      signature.initSign(privateKey(alias))
      signature.update(payload.toByteArray(Charsets.UTF_8))
      Base64.encodeToString(signature.sign(), Base64.NO_WRAP)
    }

    Function("isHardwareBacked") { alias: String ->
      val key = privateKey(alias)
      val info = KeyFactory.getInstance(key.algorithm, KEYSTORE).getKeySpec(key, KeyInfo::class.java)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        info.securityLevel != KeyProperties.SECURITY_LEVEL_SOFTWARE
      } else {
        @Suppress("DEPRECATION")
        info.isInsideSecureHardware
      }
    }

    Function("deleteKey") { alias: String ->
      if (keyStore.containsAlias(alias)) keyStore.deleteEntry(alias)
    }

    // Text in, "iv:ciphertext" (base64) out. Background thread: the queue can be a few megabytes.
    AsyncFunction("encrypt") { plain: String ->
      val cipher = Cipher.getInstance(CIPHER).apply { init(Cipher.ENCRYPT_MODE, secretKey()) }
      val sealed = cipher.doFinal(plain.toByteArray(Charsets.UTF_8))
      Base64.encodeToString(cipher.iv, Base64.NO_WRAP) + ":" + Base64.encodeToString(sealed, Base64.NO_WRAP)
    }

    AsyncFunction("decrypt") { sealed: String ->
      val (iv, body) = sealed.split(":", limit = 2)
      val cipher = Cipher.getInstance(CIPHER).apply {
        init(Cipher.DECRYPT_MODE, secretKey(), GCMParameterSpec(TAG_BITS, Base64.decode(iv, Base64.NO_WRAP)))
      }
      String(cipher.doFinal(Base64.decode(body, Base64.NO_WRAP)), Charsets.UTF_8)
    }

    Function("deleteSecret") {
      if (keyStore.containsAlias(SECRET_ALIAS)) keyStore.deleteEntry(SECRET_ALIAS)
    }

    // Counts time asleep and does not move when the clock is set. Resets to zero when the phone restarts.
    Function("elapsedRealtimeMs") { SystemClock.elapsedRealtime().toDouble() }

    // Restarts since the phone was set up, or -1 when this Android version will not say.
    Function("bootCount") {
      try {
        Settings.Global.getInt(appContext.reactContext?.contentResolver, Settings.Global.BOOT_COUNT, -1)
      } catch (_: SecurityException) {
        -1
      }
    }
  }

  private fun generate(alias: String) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
        generate(alias, strongBox = true)
        return
      }
    } catch (_: StrongBoxUnavailableException) {
      // Not every phone has a StrongBox chip; the TEE-backed key below is still hardware-backed.
    }
    generate(alias, strongBox = false)
  }

  private fun generate(alias: String, strongBox: Boolean) {
    val spec = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN)
      .setAlgorithmParameterSpec(ECGenParameterSpec(CURVE))
      .setDigests(KeyProperties.DIGEST_SHA256)
      .apply {
        if (strongBox && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) setIsStrongBoxBacked(true)
      }
      .build()
    KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, KEYSTORE).apply {
      initialize(spec)
      generateKeyPair()
    }
  }

  private fun secretKey(): SecretKey {
    (keyStore.getKey(SECRET_ALIAS, null) as? SecretKey)?.let { return it }
    return try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) newSecret(strongBox = true) else newSecret(strongBox = false)
    } catch (_: StrongBoxUnavailableException) {
      newSecret(strongBox = false)
    }
  }

  private fun newSecret(strongBox: Boolean): SecretKey {
    val spec = KeyGenParameterSpec.Builder(SECRET_ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setKeySize(256)
      .apply {
        if (strongBox && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) setIsStrongBoxBacked(true)
      }
      .build()
    return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, KEYSTORE).apply { init(spec) }.generateKey()
  }

  private fun publicKey(alias: String): String {
    val certificate = keyStore.getCertificate(alias) ?: throw KeyMissingException(alias)
    return Base64.encodeToString(certificate.publicKey.encoded, Base64.NO_WRAP)
  }

  private fun privateKey(alias: String): PrivateKey =
    keyStore.getKey(alias, null) as? PrivateKey ?: throw KeyMissingException(alias)
}
