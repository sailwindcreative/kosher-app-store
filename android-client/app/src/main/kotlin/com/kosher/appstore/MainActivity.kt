package com.kosher.appstore

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import com.kosher.appstore.ui.AppListScreen
import com.kosher.appstore.ui.AppsViewModel
import com.kosher.appstore.ui.theme.KosherAppStoreTheme

class MainActivity : ComponentActivity() {
    private val viewModel: AppsViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        setContent {
            KosherAppStoreTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val uiState by viewModel.uiState.collectAsState()
                    val deviceId by viewModel.deviceId.collectAsState()
                    val downloadingApps by viewModel.downloadingApps.collectAsState()
                    
                    AppListScreen(
                        uiState = uiState,
                        deviceId = deviceId,
                        downloadingApps = downloadingApps,
                        onInstallClick = { app -> viewModel.installApp(app) },
                        onRetryClick = { viewModel.loadApps() }
                    )
                }
            }
        }
    }
}

