# Please add these rules to your existing keep rules in order to suppress warnings.
# This is generated automatically by the Android Gradle plugin.
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivity$g
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivityStarter$Args
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivityStarter$Error
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningActivityStarter
-dontwarn com.stripe.android.pushProvisioning.PushProvisioningEphemeralKeyProvider

# Keep Stripe push provisioning classes
-keep class com.stripe.android.pushProvisioning.PushProvisioningActivity$g { *; }
-keep class com.stripe.android.pushProvisioning.PushProvisioningActivityStarter$Args { *; }
-keep class com.stripe.android.pushProvisioning.PushProvisioningActivityStarter$Error { *; }
-keep class com.stripe.android.pushProvisioning.PushProvisioningActivityStarter { *; }
-keep class com.stripe.android.pushProvisioning.PushProvisioningEphemeralKeyProvider { *; }
-keep class com.stripe.android.pushProvisioning.EphemeralKeyUpdateListener { *; }
-keep class com.stripe.android.pushProvisioning.** { *; }

# Additional React Native Stripe SDK rules
-keep class com.reactnativestripesdk.pushprovisioning.** { *; }
-keep class com.reactnativestripesdk.pushprovisioning.PushProvisioningProxy { *; }
-keep class com.reactnativestripesdk.pushprovisioning.DefaultPushProvisioningProxy { *; }
-keep interface com.stripe.android.pushProvisioning.EphemeralKeyUpdateListener { *; }
-keep class com.stripe.android.pushProvisioning.EphemeralKeyProvider { *; }
-keep class com.reactnativestripesdk.pushprovisioning.EphemeralKeyProvider { *; }