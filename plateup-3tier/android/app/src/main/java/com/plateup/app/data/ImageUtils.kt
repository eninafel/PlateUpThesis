package com.plateup.app.data

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.min

object ImageUtils {
    /**
     * Reads a photo, fixes its rotation, shrinks it so the upload is small and fast,
     * and returns it as a JPEG encoded in base64 (the format the PHP backend expects).
     * Call this off the main thread.
     */
    fun uriToBase64Jpeg(context: Context, uri: Uri, maxSide: Int = 1280): String {
        val resolver = context.contentResolver

        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, bounds) }
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) error("Couldn't read that photo.")

        var sample = 1
        while (max(bounds.outWidth, bounds.outHeight) / sample > maxSide * 2) sample *= 2
        val options = BitmapFactory.Options().apply { inSampleSize = sample }
        val bitmap = resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
            ?: error("Couldn't read that photo.")

        val rotation = resolver.openInputStream(uri)?.use { stream ->
            when (ExifInterface(stream).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)) {
                ExifInterface.ORIENTATION_ROTATE_90 -> 90f
                ExifInterface.ORIENTATION_ROTATE_180 -> 180f
                ExifInterface.ORIENTATION_ROTATE_270 -> 270f
                else -> 0f
            }
        } ?: 0f

        val scale = min(1f, maxSide.toFloat() / max(bitmap.width, bitmap.height))
        val matrix = Matrix().apply {
            postRotate(rotation)
            postScale(scale, scale)
        }
        val finalBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)

        val out = ByteArrayOutputStream()
        finalBitmap.compress(Bitmap.CompressFormat.JPEG, 80, out)
        return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
    }
}
