import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { COLORS, SHADOWS } from "../styles/theme";
import logoIcon from "../../assets/logo-icon.png";

interface LoginScreenProps {
  apiBase: string;
  onLoginSuccess: (token: string, profile: any) => void;
  isLoading: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ apiBase, onLoginSuccess, isLoading }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: phone, 2: name/email registration, 3: OTP
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleContinuePhone = async () => {
    if (phone.length !== 10) {
      Alert.alert("Invalid Input", "Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsActionLoading(true);
    try {
      const checkRes = await fetch(`${apiBase}/api/auth/check-mobile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: phone, role: "tenant" })
      });
      const checkData = await checkRes.json();

      if (checkData.error) {
        Alert.alert("Error", checkData.error);
        return;
      }

      if (checkData.exists) {
        // Tenant exists -> directly request OTP
        await triggerSendOtp();
      } else {
        // Tenant does not exist -> show registration form
        Alert.alert("Register", "No tenant profile found with this number. Please fill in registration details below.");
        setStep(2);
      }
    } catch (err) {
      Alert.alert("Connection Error", "Could not connect to backend server.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const triggerSendOtp = async () => {
    setIsActionLoading(true);
    try {
      const otpRes = await fetch(`${apiBase}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: phone, role: "tenant" })
      });
      const otpData = await otpRes.json();

      if (otpData.error) {
        Alert.alert("Error", otpData.error);
        return;
      }

      if (otpData.success) {
        setVerificationToken(otpData.verification_token);
        setDevOtp(otpData.dev_otp);
        setResendTimer(120); // 2 minutes cooldown
        setStep(3);
      }
    } catch (err) {
      Alert.alert("Connection Error", "Failed to send OTP. Try again later.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRegisterDetailsSubmit = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Missing Fields", "Please enter both full name and email.");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    triggerSendOtp();
  };

  const triggerVerify = async (otpCode: string) => {
    setIsActionLoading(true);
    try {
      const verifyRes = await fetch(`${apiBase}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: phone,
          otp: otpCode,
          verification_token: verificationToken,
          role: "tenant",
          name,
          email
        })
      });
      const verifyData = await verifyRes.json();

      if (verifyData.error) {
        Alert.alert("Verification Failed", verifyData.error);
        return;
      }

      if (verifyData.token) {
        onLoginSuccess(verifyData.token, verifyData.profile);
      }
    } catch (err) {
      Alert.alert("Connection Error", "Failed to verify OTP.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    const clean = text.replace(/\D/g, "").slice(0, 6);
    setOtp(clean);
    if (clean.length === 6) {
      triggerVerify(clean);
    }
  };

  const handleChangeNumber = () => {
    setStep(1);
    setOtp("");
    setVerificationToken("");
    setDevOtp("");
  };

  const isWorking = isLoading || isActionLoading;

  return (
    <View style={styles.loginContainer}>
      <View style={styles.loginCard}>
        {/* Header Block inside the card */}
        <View style={styles.loginHeader}>
          <Image source={logoIcon} style={styles.loginLogo} />
          <Text style={styles.loginBrand}>
            Homie<Text style={styles.highlight}>PG</Text>
          </Text>
        </View>
        <Text style={styles.loginSubtitle}>Your Home. Your People. Your Comfort.</Text>

        <Text style={styles.loginCardTitle}>
          {step === 1 && "Sign In / Register"}
          {step === 2 && "Create Tenant Profile"}
          {step === 3 && `OTP sent to +91 ${phone}`}
        </Text>

        {/* Step 1: Mobile number */}
        {step === 1 && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Number</Text>
            <View style={styles.phoneInputContainer}>
              <Text style={styles.phonePrefix}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="9876543210"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={(t) => setPhone(t.replace(/\D/g, ""))}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isWorking}
              />
            </View>
          </View>
        )}

        {/* Step 2: Register Fields */}
        {step === 2 && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Rahul Sharma"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                editable={!isWorking}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="rahul@example.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isWorking}
              />
            </View>
          </View>
        )}

        {/* Step 3: OTP Fields */}
        {step === 3 && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                placeholderTextColor="#94A3B8"
                value={otp}
                onChangeText={handleOtpChange}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isWorking}
              />
            </View>

            {/* Dev / Sandbox OTP indicator */}
            {devOtp ? (
              <View style={styles.devBanner}>
                <Text style={styles.devBannerText}>
                  Demo Mode: Use code <Text style={styles.devOtpText}>{devOtp}</Text>
                </Text>
              </View>
            ) : null}

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive code?</Text>
              <TouchableOpacity
                onPress={triggerSendOtp}
                disabled={resendTimer > 0 || isWorking}
              >
                <Text style={[styles.resendBtn, resendTimer > 0 && styles.resendDisabled]}>
                  {resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Back link */}
        {step !== 1 && (
          <TouchableOpacity onPress={handleChangeNumber} disabled={isWorking} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Change Phone Number</Text>
          </TouchableOpacity>
        )}

        {/* Continue Button */}
        <TouchableOpacity
          style={[
            styles.loginBtn,
            (isWorking || (step === 1 && phone.length !== 10)) && styles.disabledBtn
          ]}
          onPress={() => {
            if (step === 1) handleContinuePhone();
            else if (step === 2) handleRegisterDetailsSubmit();
            else if (step === 3) triggerVerify(otp);
          }}
          disabled={isWorking || (step === 1 && phone.length !== 10)}
        >
          {isWorking ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {step === 1 && "Continue"}
              {step === 2 && "Send OTP"}
              {step === 3 && "Verify & Sign In"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loginHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  loginLogo: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  loginBrand: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  highlight: {
    color: COLORS.accent,
  },
  loginSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "500",
  },
  loginCard: {
    backgroundColor: COLORS.cardBg,
    padding: 24,
    borderRadius: 16,
    width: "100%",
    maxWidth: 360,
    ...SHADOWS.large,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  loginCardTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 16,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
    width: "100%",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textDark,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    width: "100%",
    fontSize: 15,
    color: COLORS.textDark,
  },
  phoneInputContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: "hidden",
    width: "100%",
  },
  phonePrefix: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: COLORS.border,
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textMuted,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.textDark,
  },
  otpInput: {
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: "bold",
  },
  formContainer: {
    width: "100%",
  },
  devBanner: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 8,
    borderRadius: 8,
    marginBottom: 15,
  },
  devBannerText: {
    fontSize: 12,
    color: "#1E40AF",
    textAlign: "center",
    fontWeight: "500",
  },
  devOtpText: {
    fontWeight: "bold",
  },
  resendRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  resendText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  resendBtn: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  resendDisabled: {
    color: COLORS.textMuted,
  },
  backBtn: {
    marginBottom: 15,
    alignSelf: "flex-start",
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    ...SHADOWS.small,
  },
  disabledBtn: {
    backgroundColor: COLORS.textMuted,
  },
  btnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
});
