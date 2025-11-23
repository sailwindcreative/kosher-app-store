package com.kosher.appstore.data

import retrofit2.Response
import retrofit2.http.*

/**
 * API service interface for the Kosher App Store backend
 */
interface AppStoreApi {
    @POST("api/devices/register")
    suspend fun registerDevice(@Body request: RegisterDeviceRequest): Response<RegisterDeviceResponse>
    
    @GET("api/apps")
    suspend fun getApps(@Query("device_id") deviceId: String): Response<List<App>>
    
    @POST("api/apps/{appId}/download")
    suspend fun requestDownload(
        @Path("appId") appId: String,
        @Body request: DownloadRequest
    ): Response<DownloadResponse>
}

// Request/Response models
data class RegisterDeviceRequest(
    val device_id: String,
    val app_version: String
)

data class RegisterDeviceResponse(
    val device_id: String,
    val status: String
)

data class App(
    val id: String,
    val package_name: String,
    val display_name: String,
    val short_description: String?,
    val icon_url: String?,
    val current_version_name: String?
)

data class DownloadRequest(
    val device_id: String
)

data class DownloadResponse(
    val download_url: String
)

