package com.kosher.appstore.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.UUID

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "settings")

/**
 * Manages device ID generation and persistence
 */
class DeviceIdManager(private val context: Context) {
    private val deviceIdKey = stringPreferencesKey("device_id")
    
    val deviceId: Flow<String> = context.dataStore.data.map { preferences ->
        preferences[deviceIdKey] ?: ""
    }
    
    suspend fun getOrCreateDeviceId(): String {
        var id = ""
        context.dataStore.data.map { preferences ->
            preferences[deviceIdKey]
        }.collect { storedId ->
            id = storedId ?: ""
        }
        
        if (id.isEmpty()) {
            id = UUID.randomUUID().toString()
            context.dataStore.edit { preferences ->
                preferences[deviceIdKey] = id
            }
        }
        
        return id
    }
}

