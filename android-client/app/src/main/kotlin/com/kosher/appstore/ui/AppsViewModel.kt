package com.kosher.appstore.ui

import android.app.Application
import android.app.DownloadManager
import android.content.Context
import android.net.Uri
import android.util.Log
import androidx.core.content.FileProvider
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.kosher.appstore.BuildConfig
import com.kosher.appstore.data.ApiClient
import com.kosher.appstore.data.App
import com.kosher.appstore.data.AppRepository
import com.kosher.appstore.data.DeviceIdManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.io.File

sealed class UiState {
    data object Loading : UiState()
    data class Success(val apps: List<App>) : UiState()
    data class Error(val message: String) : UiState()
}

class AppsViewModel(application: Application) : AndroidViewModel(application) {
    private val repository = AppRepository(
        ApiClient.api,
        DeviceIdManager(application)
    )
    
    private val _uiState = MutableStateFlow<UiState>(UiState.Loading)
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    private val _deviceId = MutableStateFlow("")
    val deviceId: StateFlow<String> = _deviceId.asStateFlow()
    
    private val _downloadingApps = MutableStateFlow<Set<String>>(emptySet())
    val downloadingApps: StateFlow<Set<String>> = _downloadingApps.asStateFlow()
    
    init {
        initialize()
    }
    
    private fun initialize() {
        viewModelScope.launch {
            // Register device
            repository.registerDevice(BuildConfig.VERSION_NAME).onSuccess { deviceId ->
                _deviceId.value = deviceId
                loadApps()
            }.onFailure { error ->
                _uiState.value = UiState.Error("Failed to register device: ${error.message}")
            }
        }
    }
    
    fun loadApps() {
        viewModelScope.launch {
            _uiState.value = UiState.Loading
            
            repository.getApps().onSuccess { apps ->
                _uiState.value = UiState.Success(apps)
            }.onFailure { error ->
                _uiState.value = UiState.Error(error.message ?: "Unknown error")
            }
        }
    }
    
    fun installApp(app: App) {
        viewModelScope.launch {
            _downloadingApps.value = _downloadingApps.value + app.id
            
            try {
                // Request download URL from backend
                repository.requestDownload(app.id).onSuccess { downloadUrl ->
                    // Start download using DownloadManager
                    startDownload(app, downloadUrl)
                }.onFailure { error ->
                    Log.e("AppsViewModel", "Failed to get download URL", error)
                    _downloadingApps.value = _downloadingApps.value - app.id
                }
            } catch (e: Exception) {
                Log.e("AppsViewModel", "Error during install", e)
                _downloadingApps.value = _downloadingApps.value - app.id
            }
        }
    }
    
    private fun startDownload(app: App, downloadUrl: String) {
        val context = getApplication<Application>()
        val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        
        // Create downloads directory in cache
        val apkDir = File(context.cacheDir, "apks")
        if (!apkDir.exists()) {
            apkDir.mkdirs()
        }
        
        val fileName = "${app.package_name}.apk"
        val destFile = File(apkDir, fileName)
        
        // Delete existing file if present
        if (destFile.exists()) {
            destFile.delete()
        }
        
        val request = DownloadManager.Request(Uri.parse(downloadUrl))
            .setTitle(app.display_name)
            .setDescription("Downloading ${app.display_name}")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationUri(Uri.fromFile(destFile))
            .setAllowedOverMetered(true)
            .setAllowedOverRoaming(false)
        
        try {
            downloadManager.enqueue(request)
            // Note: In a production app, you'd want to register a BroadcastReceiver
            // to listen for DOWNLOAD_COMPLETE and then trigger installation
            // For now, the user will need to tap the notification
            
            _downloadingApps.value = _downloadingApps.value - app.id
        } catch (e: Exception) {
            Log.e("AppsViewModel", "Error starting download", e)
            _downloadingApps.value = _downloadingApps.value - app.id
        }
    }
}

