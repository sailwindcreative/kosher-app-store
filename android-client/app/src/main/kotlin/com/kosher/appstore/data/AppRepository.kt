package com.kosher.appstore.data

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Repository for app-related data operations
 */
class AppRepository(
    private val api: AppStoreApi,
    private val deviceIdManager: DeviceIdManager
) {
    suspend fun registerDevice(appVersion: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val deviceId = deviceIdManager.getOrCreateDeviceId()
            val response = api.registerDevice(
                RegisterDeviceRequest(
                    device_id = deviceId,
                    app_version = appVersion
                )
            )
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(deviceId)
            } else {
                Result.failure(Exception("Registration failed: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e("AppRepository", "Error registering device", e)
            Result.failure(e)
        }
    }
    
    suspend fun getApps(): Result<List<App>> = withContext(Dispatchers.IO) {
        try {
            val deviceId = deviceIdManager.getOrCreateDeviceId()
            val response = api.getApps(deviceId)
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                Result.failure(Exception("Failed to fetch apps: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e("AppRepository", "Error fetching apps", e)
            Result.failure(e)
        }
    }
    
    suspend fun requestDownload(appId: String): Result<String> = withContext(Dispatchers.IO) {
        try {
            val deviceId = deviceIdManager.getOrCreateDeviceId()
            val response = api.requestDownload(
                appId,
                DownloadRequest(device_id = deviceId)
            )
            
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.download_url)
            } else {
                Result.failure(Exception("Failed to request download: ${response.code()}"))
            }
        } catch (e: Exception) {
            Log.e("AppRepository", "Error requesting download", e)
            Result.failure(e)
        }
    }
}

