package expo.modules.devicekey

import android.os.Build
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

private const val KEYSTORE = "AndroidKeyStore"
private const val CURVE = "secp256r1"
private const val SIGNATURE_ALGORITHM = "SHA256withECDSA"

class KeyMissingException(alias: String) :
  CodedException("ERR_KEY_MISSING", "No device key named '$alias'", null)

/**
 * An ECDSA P-256 key pair that lives in the Android Keystore. The private key never leaves the
 * secure hardware; JS only gets the public key (SPKI DER, base64) and signatures (DER, base64),
 * which is what the face_biometric backend verifies.
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

  private fun publicKey(alias: String): String {
    val certificate = keyStore.getCertificate(alias) ?: throw KeyMissingException(alias)
    return Base64.encodeToString(certificate.publicKey.encoded, Base64.NO_WRAP)
  }

  private fun privateKey(alias: String): PrivateKey =
    keyStore.getKey(alias, null) as? PrivateKey ?: throw KeyMissingException(alias)
}
