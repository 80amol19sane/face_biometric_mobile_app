package expo.modules.modelasset

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class AssetCopyException(name: String, cause: Throwable) :
  CodedException("ERR_MODEL_ASSET", "Could not copy bundled file '$name': ${cause.message}", cause)

/**
 * Release builds keep the face model inside the APK, but the TFLite loader reads a plain file URL
 * (java.net.URL), which cannot open APK entries. This copies the model out once and returns its path.
 */
class ModelAssetModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ModelAsset")

    AsyncFunction("materialize") { name: String -> materialize(name) }
  }

  private fun materialize(name: String): String {
    val context = appContext.reactContext ?: throw IllegalStateException("React context is not ready")
    val target = File(context.filesDir, name)
    try {
      // An app update may ship a new model, so a copy older than the install is refreshed.
      val installedAt = context.packageManager.getPackageInfo(context.packageName, 0).lastUpdateTime
      if (!target.exists() || target.lastModified() < installedAt) {
        val partial = File(context.filesDir, "$name.part")
        context.assets.open(name).use { input -> partial.outputStream().use { input.copyTo(it) } }
        if (!partial.renameTo(target)) throw IllegalStateException("Could not move $name into place")
      }
    } catch (e: Exception) {
      throw AssetCopyException(name, e)
    }
    return "file://${target.absolutePath}"
  }
}
