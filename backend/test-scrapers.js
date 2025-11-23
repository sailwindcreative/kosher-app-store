/**
 * Test script for APKMirror and APKPure scrapers
 */
import { APKMirrorProvider } from './src/sources/apkmirror.js';
import { APKPureProvider } from './src/sources/apkpure.js';

async function testScrapers() {
  console.log('\n🧪 Testing APKMirror and APKPure Scrapers\n');
  console.log('='.repeat(60));
  
  // Test package - using a popular app
  const testPackage = 'com.whatsapp';
  
  // Test APKMirror
  console.log('\n📦 Testing APKMirror Provider');
  console.log('-'.repeat(60));
  try {
    const apkMirror = new APKMirrorProvider();
    const mirrorMetadata = await apkMirror.fetchMetadata(testPackage);
    
    if (mirrorMetadata) {
      console.log('✅ APKMirror Success!');
      console.log('   Display Name:', mirrorMetadata.displayName);
      console.log('   Package:', mirrorMetadata.packageName);
      console.log('   Icon:', mirrorMetadata.iconUrl ? '✓' : '✗');
      console.log('   Description:', mirrorMetadata.shortDescription.substring(0, 80) + '...');
      console.log('   Versions:', mirrorMetadata.versions.length);
      if (mirrorMetadata.versions[0]) {
        console.log('   Download URL:', mirrorMetadata.versions[0].downloadUrl ? '✓ Found' : '✗ Not found');
      }
    } else {
      console.log('❌ APKMirror: No metadata returned');
    }
  } catch (error) {
    console.log('❌ APKMirror Error:', error.message);
  }
  
  // Test APKPure
  console.log('\n📦 Testing APKPure Provider');
  console.log('-'.repeat(60));
  try {
    const apkPure = new APKPureProvider();
    const pureMetadata = await apkPure.fetchMetadata(testPackage);
    
    if (pureMetadata) {
      console.log('✅ APKPure Success!');
      console.log('   Display Name:', pureMetadata.displayName);
      console.log('   Package:', pureMetadata.packageName);
      console.log('   Icon:', pureMetadata.iconUrl ? '✓' : '✗');
      console.log('   Description:', pureMetadata.shortDescription.substring(0, 80) + '...');
      console.log('   Versions:', pureMetadata.versions.length);
      if (pureMetadata.versions[0]) {
        console.log('   Download URL:', pureMetadata.versions[0].downloadUrl ? '✓ Found' : '✗ Not found');
      }
    } else {
      console.log('❌ APKPure: No metadata returned');
    }
  } catch (error) {
    console.log('❌ APKPure Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Tests Complete\n');
}

testScrapers().catch(console.error);

