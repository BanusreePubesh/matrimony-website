import { useState } from "react";
import { ArrowRight, CheckCircle, Heart } from "lucide-react";
function LoginPage({ setPage }: { setPage: (p: Page) => void }) {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 py-16 px-4">
      <div className="max-w-md mx-auto">
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-teal-800">VivahShaadi</span>
          </div>
          <p className="text-gray-500 text-sm">Login to find your perfect match</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100 space-y-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-800">Login</h2>
            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
              Enter your WhatsApp number to receive an OTP and access your profile.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number</label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="flex items-center px-3.5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold text-gray-700 gap-1.5 flex-shrink-0 cursor-pointer hover:bg-gray-100 transition-colors">
                <span>IN +91</span>
                <span className="text-[10px] text-gray-400">▼</span>
              </div>
              {/* Number input */}
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all min-w-0"
              />
              {/* Send OTP button */}
              <button
                type="button"
                onClick={() => {
                  if (phone.length === 10) {
                    setOtpSent(true);
                  }
                }}
                className="px-4 py-3 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Send OTP
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
              <p className="text-sm font-medium text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                OTP sent to your WhatsApp. Enter below:
              </p>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    id={`login-otp-${i}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      const n = [...otp];
                      n[i] = val;
                      setOtp(n);
                      if (val && i < 5) {
                        document.getElementById(`login-otp-${i + 1}`)?.focus();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !otp[i] && i > 0) {
                        document.getElementById(`login-otp-${i - 1}`)?.focus();
                      }
                    }}
                    className="w-10 h-10 text-center border border-emerald-200 rounded-lg text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white text-slate-800"
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setPage("dashboard")}
            className="w-full py-3.5 bg-[#0d5943] hover:bg-[#0a4635] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <button
                onClick={() => setPage("register")}
                className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Register Free
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
