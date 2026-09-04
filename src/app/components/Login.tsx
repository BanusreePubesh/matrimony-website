import { useState } from "react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { MercuryLogoIcon } from "./MercuryLogoIcon";

export function LoginPage({ setPage }: { setPage: (p: any) => void }) {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0F2C59] to-slate-900 py-16 px-4 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <MercuryLogoIcon className="w-11 h-11" />
            <span className="font-display font-extrabold text-2xl tracking-wide text-white">MERCURY CONNECT</span>
          </div>
          <p className="text-sky-300 text-sm font-medium">The secure space to meet your soulmate</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-sky-100/50 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Login</h2>
            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
              Enter your WhatsApp number to receive an OTP and access your profile on MERCURY CONNECT.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number</label>
            <div className="flex gap-2">
              {/* Country Code Dropdown */}
              <div className="flex items-center px-3.5 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm font-semibold text-slate-700 gap-1.5 flex-shrink-0 cursor-pointer hover:bg-slate-100 transition-colors">
                <span>IN +91</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
              {/* Number input */}
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 focus:outline-none focus:border-[#0284C7] focus:bg-white transition-all min-w-0"
              />
              {/* Send OTP button */}
              <button
                type="button"
                onClick={() => {
                  if (phone.length === 10) {
                    setOtpSent(true);
                  }
                }}
                className="px-5 py-3 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer shadow-md"
              >
                Send OTP
              </button>
            </div>
          </div>

          {otpSent && (
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-4">
              <p className="text-sm font-medium text-sky-900 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#1D72B8]" />
                OTP sent to your phone. Enter below:
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
                    className="w-10 h-10 text-center border border-sky-300 rounded-lg text-lg font-bold focus:outline-none focus:border-[#1D72B8] focus:ring-2 focus:ring-sky-200 bg-white text-slate-800"
                  />
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => setPage("dashboard")}
            className="w-full py-4 bg-gradient-to-r from-[#003B7B] via-[#1D72B8] to-[#56B7EE] hover:opacity-95 text-white font-bold text-base rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Login to MERCURY CONNECT</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <p className="text-sm text-slate-500">
              Don't have an account?{" "}
              <button
                onClick={() => setPage("register")}
                className="font-bold text-[#0284C7] hover:text-[#0F2C59] transition-colors bg-transparent border-none p-0 cursor-pointer"
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

export default LoginPage;
