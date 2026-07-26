import { useState } from "react";
import { ArrowRight, CheckCircle, Heart } from "lucide-react";
// import { ArrowRight, CheckCircle, Camera, Upload, MapPin, ImgIcon, Sparkles, Heart, ChevronLeft, ChevronRight } from "lucide-react";
// import TextInput from "./TextInput";
// import SelectInput from "./SelectInput";
// function RegisterStep1({ onNext, setPage }: { onNext: () => void; setPage: (p: Page) => void }) {
//   const [otpSent, setOtpSent] = useState(false);
//   const [otp, setOtp] = useState(["", "", "", "", "", ""]);
//   const [gender, setGender] = useState<"bride" | "groom">("bride");
//   const [phone, setPhone] = useState("");

//   return (
//     <div className="space-y-5">
//       <div className="mb-4">
//         <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
//         <p className="text-sm text-gray-500 mt-1">Enter your WhatsApp number and select gender.</p>
//       </div>

//       <div>
//         <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number</label>
//         <div className="flex gap-2">
//           {/* Country Code Dropdown */}
//           <div className="flex items-center px-3.5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold text-gray-700 gap-1.5 flex-shrink-0 hover:bg-gray-100 transition-colors">
// <select>
//     <option value="+91">IN +91</option>
//     <option value="+1">US +1</option>
//     <option value="+44">GB +44</option>
//     <option value="+1">CA +1</option>
//     <option value="+971">AE +971</option>
//        {/* <span className="text-[10px] text-gray-400">▼</span> */}

//   </select>           
//           </div>
//           {/* Number input */}
//           <input
//             type="tel"
//             maxLength={10}
//             value={phone}
//             onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
//             placeholder="9876543210"
//             className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all min-w-0"
//           />
//         </div>
//       </div>

//       <div>
//         <label className="block text-sm font-semibold text-slate-700 mb-2">Gender / பாலினம்</label>
//         <div className="grid grid-cols-2 gap-3">
//           <button
//             type="button"
//             onClick={() => setGender("bride")}
//             className={`py-3.5 px-4 text-center font-bold text-sm rounded-xl border-2 transition-all duration-200 cursor-pointer ${
//               gender === "bride"
//                 ? "border-emerald-500 text-emerald-600 bg-emerald-50/10"
//                 : "border-gray-200 text-gray-400 hover:border-gray-300"
//             }`}
//           >
//             Bride / பெண்
//           </button>
//           <button
//             type="button"
//             onClick={() => setGender("groom")}
//             className={`py-3.5 px-4 text-center font-bold text-sm rounded-xl border-2 transition-all duration-200 cursor-pointer ${
//               gender === "groom"
//                 ? "border-emerald-500 text-emerald-600 bg-emerald-50/20"
//                 : "border-gray-200 text-gray-400 hover:border-gray-300"
//             }`}
//           >
//             Groom / ஆண்
//           </button>
//         </div>
//       </div>

//       {!otpSent ? (
//         <button
//           onClick={() => {
//             if (phone.length === 10) {
//               setOtpSent(true);
//             }
//           }}
//           className="w-full py-3.5 mt-4 bg-[#70a597] hover:bg-[#5f9385] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
//         >
//           <span>Send OTP</span>
//           <ArrowRight className="w-4 h-4" />
//         </button>
//       ) : (
//         <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-4">
//           <p className="text-sm font-medium text-emerald-800 flex items-center gap-1.5">
//             <CheckCircle className="w-4 h-4 text-emerald-600" />
//             OTP sent to your WhatsApp. Enter below:
//           </p>
//           <div className="flex gap-2 justify-center">
//             {otp.map((digit, i) => (
//               <input
//                 key={i}
//                 type="text"
//                 maxLength={1}
//                 value={digit}
//                 id={`otp-input-${i}`}
//                 onChange={(e) => {
//                   const val = e.target.value.replace(/\D/g, "");
//                   const n = [...otp];
//                   n[i] = val;
//                   setOtp(n);
//                   if (val && i < 5) {
//                     document.getElementById(`otp-input-${i + 1}`)?.focus();
//                   }
//                 }}
//                 onKeyDown={(e) => {
//                   if (e.key === "Backspace" && !otp[i] && i > 0) {
//                     document.getElementById(`otp-input-${i - 1}`)?.focus();
//                   }
//                 }}
//                 className="w-10 h-10 text-center border border-emerald-200 rounded-lg text-lg font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-white text-slate-800"
//               />
//             ))}
//           </div>
//           <button
//             onClick={onNext}
//             className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
//           >
//             Verify OTP
//           </button>
//         </div>
//       )}

//       <div className="text-center mt-6">
//         <p className="text-sm text-gray-500">
//           Already have an account?{" "}
//           <button
//             onClick={() => setPage("login")}
//             className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
//           >
//             Login
//           </button>
//         </p>
//       </div>
//     </div>
//   );
// }

// function RegisterStep2() {
//   const [useLocation, setUseLocation] = useState(false);
//   return (
//     <div className="space-y-4">
//       <div className="mb-3">
//         <h2 className="font-display text-xl font-bold text-gray-900">Your Location</h2>
//         <p className="text-sm text-gray-500">Help us find compatible matches near you</p>
//       </div>
//       <button onClick={() => setUseLocation(true)} className={`w-full py-5 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-4 ${useLocation ? "border-emerald-400 bg-emerald-50" : "border-rose-200 hover:border-rose-400 hover:bg-rose-50"}`}>
//         <MapPin className={`w-6 h-6 ${useLocation ? "text-emerald-600" : "text-rose-600"}`} />
//         <div className="text-left">
//           <p className={`font-semibold ${useLocation ? "text-emerald-700" : "text-rose-700"}`}>
//             {useLocation ? "Location Detected!" : "Use Current Location"}
//           </p>
//           <p className="text-xs text-gray-500 mt-0.5">{useLocation ? "Chennai, Tamil Nadu, India · 600001" : "Allow location access for better local matches"}</p>
//         </div>
//         {useLocation && <CheckCircle className="w-5 h-5 text-emerald-500 ml-auto" />}
//       </button>
//       <div className="relative flex items-center">
//         <div className="flex-grow border-t border-gray-200" /><span className="px-3 text-xs text-gray-400 bg-white">or select manually</span><div className="flex-grow border-t border-gray-200" />
//       </div>
//       <SelectInput label="Country" options={["India", "USA", "UK", "Canada", "Australia", "Singapore", "UAE"]} />
//       <SelectInput label="State" options={["Tamil Nadu", "Karnataka", "Andhra Pradesh", "Telangana", "Kerala", "Maharashtra", "Delhi", "Gujarat"]} />
//       <div className="grid grid-cols-2 gap-3">
//         <TextInput label="District" placeholder="Enter district" />
//         <TextInput label="City / Town" placeholder="Enter city" />
//       </div>
//       <TextInput label="Pincode" type="number" placeholder="600001" />
//     </div>
//   );
// }

// function RegisterStep3({ onNext }: { onNext: () => void }) {
//   const [locationCaptured, setLocationCaptured] = useState(false);

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="font-display text-2xl font-bold text-slate-900">Location Verification</h2>
//         <p className="text-sm text-slate-500 mt-2 leading-relaxed">
//           We require location access to verify your regional profile authenticity and enable accurate horoscope match calculations.
//         </p>
//       </div>

//       <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center text-center border border-slate-100">
//         <div className="w-12 h-12 bg-[#ebf8f4] rounded-full flex items-center justify-center mb-4">
//           <MapPin className="w-6 h-6 text-[#34b48d]" />
//         </div>
        
//         <h3 className="font-bold text-slate-900 text-lg">Enable Location Services</h3>
//         <p className="text-xs text-slate-500 mt-2 max-w-[250px] leading-relaxed">
//           Click the button below to grant location access. This ensures secure and genuine registrations.
//         </p>

//         {locationCaptured && (
//           <div className="mt-4 px-3 py-1.5 bg-[#ebf8f4] border border-[#a3e6d1] text-[#0f766e] text-xs font-semibold rounded-full flex items-center gap-1.5">
//             <CheckCircle className="w-3.5 h-3.5 text-[#34b48d]" />
//             Location captured! Lat: 10.3576, Lng: 77.9786
//           </div>
//         )}

//         <button 
//           onClick={() => {
//             if (!locationCaptured) setLocationCaptured(true);
//             else onNext();
//           }}
//           className="w-full mt-6 py-3.5 bg-[#0f766e] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
//         >
//           <span>Grant Location Access</span><ArrowRight className="w-4 h-4" />
//         </button>
//       </div>
//     </div>
//   );
// }

// function RegisterStep4({ setPage }: { setPage: (p: Page) => void }) {
//   const [file, setFile] = useState<File | null>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       setFile(e.target.files[0]);
//     }
//   };

//   return (
//     <div className="space-y-6">
//       <div>
//         <h2 className="font-display text-2xl font-bold text-slate-900">Complete Registration</h2>
//         <p className="text-sm text-slate-500 mt-1">Upload your horoscope document.</p>
//       </div>

//       <div>
//         <div className="flex items-center gap-1.5 text-[#34b48d] font-semibold text-sm mb-3">
//           <Sparkles className="w-4 h-4" />
//           <span>Horoscope (Jathagam) Document Upload</span>
//         </div>
        
//         <label 
//           onDoubleClick={() => {
//             // Mock testing
//             const mockFile = new File(["dummy content"], "mock_horoscope.pdf", { type: "application/pdf" });
//             setFile(mockFile);
//           }}
//           className="border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
//         >
//           <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
//           {file ? (
//             <>
//               <CheckCircle className="w-6 h-6 text-[#34b48d] mb-2" />
//               <p className="font-bold text-[#0f766e] text-sm">{file.name}</p>
//               <p className="text-xs text-[#34b48d] font-semibold mt-1">Uploaded successfully</p>
//             </>
//           ) : (
//             <>
//               <Upload className="w-5 h-5 text-slate-400 mb-2" strokeWidth={1.5} />
//               <p className="font-bold text-slate-900 text-sm">Click to upload Horoscope (PDF/Image)</p>
//               <p className="text-xs text-[#34b48d] font-semibold mt-1">(Or double-click here for mock testing)</p>
//             </>
//           )}
//         </label>
//       </div>
//     </div>
//   );
// }

// function RegisterPage({ step, setStep, setPage }: { step: number; setStep: (s: number) => void; setPage: (p: Page) => void }) {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 py-10 px-4">
//       <div className="max-w-lg mx-auto">
//         {/* Branding header */}
//         <div className="text-center mb-6">
//           <div className="flex items-center justify-center gap-2 mb-2">
//             <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center">
//               <Heart className="w-4 h-4 text-white fill-white" />
//             </div>
//             <span className="font-display font-bold text-xl text-teal-800">VivahShaadi</span>
//           </div>
//           <p className="text-gray-500 text-sm">Create your free profile in minutes</p>
//         </div>

//         <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100">
//           {/* Stepper */}
//           <div className="flex items-center justify-between mb-5">
//             <div className="flex gap-1.5">
//               {[1, 2, 3, 4].map((s) => (
//                 <div
//                   key={s}
//                   className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
//                     s <= step ? "bg-emerald-500" : "bg-gray-200"
//                   }`}
//                 />
//               ))}
//             </div>
//             <span className="text-xs font-semibold text-gray-400 tracking-wider">
//               STEP {step} OF 4
//             </span>
//           </div>

//           {step === 1 && <RegisterStep1 onNext={() => setStep(2)} setPage={setPage} />}
//           {step === 2 && <RegisterStep2 />}
//           {step === 3 && <RegisterStep3 onNext={() => setStep(4)} />}
//           {step === 4 && <RegisterStep4 setPage={setPage} />}
//           {step === 2 && (
//             <div className="flex gap-3 mt-6">
//               <button onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-rose-200 text-rose-700 font-semibold rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2 cursor-pointer">
//                 <ChevronLeft className="w-4 h-4" />Back
//               </button>
//               <button onClick={() => setStep(step + 1)} className="flex-1 py-3 bg-gradient-to-r from-rose-600 to-purple-700 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm cursor-pointer">
//                 <span>Continue</span><ChevronRight className="w-4 h-4" />
//               </button>
//             </div>
//           )}
//           {step === 4 && (
//             <>
//               <div className="flex gap-4 mt-8">
//                 <button onClick={() => setStep(3)} className="w-1/3 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer">
//                   Back
//                 </button>
//                 <button onClick={() => setPage("dashboard")} className="flex-1 py-3 bg-[#0f766e] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer">
//                   <span>Register <ArrowRight className="w-4 h-4 ml-1 inline" /></span>
//                 </button>
//               </div>
//               <div className="text-center mt-6">
//                 <p className="text-sm text-slate-500">
//                   Already have an account?{" "}
//                   <button
//                     onClick={() => setPage("login")}
//                     className="font-semibold text-[#34b48d] hover:text-[#2fa983] transition-colors bg-transparent border-none p-0 cursor-pointer"
//                   >
//                     Login
//                   </button>
//                 </p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

function RegisterStep1({ onNext, setPage, onOtpSent }: { onNext: () => void; setPage: (p: Page) => void; onOtpSent: (code: string) => void }) {
  const [sendingOtp, setSendingOtp] = useState(false);
  const [gender, setGender] = useState<"bride" | "groom">("bride");
  const [phone, setPhone] = useState("");

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setSendingOtp(true);
      const code = String(Math.floor(1000 + Math.random() * 9000));
      setTimeout(() => {
        setSendingOtp(false);
        onOtpSent(code);
        onNext();
      }, 1500);
    }
  };

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your WhatsApp number and select gender.</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp Number</label>
        <div className="flex gap-2">
          {/* Country Code Dropdown */}
          <div className="flex items-center px-3.5 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-semibold text-gray-700 gap-1.5 flex-shrink-0 hover:bg-gray-100 transition-colors">
            <select className="bg-transparent border-none focus:outline-none cursor-pointer">
              <option value="+91">IN +91</option>
              <option value="+1">US +1</option>
              <option value="+44">GB +44</option>
              <option value="+1">CA +1</option>
              <option value="+971">AE +971</option>
            </select>
          </div>
          {/* Number input */}
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            placeholder="9876543210"
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all min-w-0"
            disabled={sendingOtp}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Gender / பாலினம்</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setGender("bride")}
            disabled={sendingOtp}
            className={`py-3.5 px-4 text-center font-bold text-sm rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              gender === "bride"
                ? "border-emerald-500 text-emerald-600 bg-emerald-50/10"
                : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            Bride / பெண்
          </button>
          <button
            type="button"
            onClick={() => setGender("groom")}
            disabled={sendingOtp}
            className={`py-3.5 px-4 text-center font-bold text-sm rounded-xl border-2 transition-all duration-200 cursor-pointer ${
              gender === "groom"
                ? "border-emerald-500 text-emerald-600 bg-emerald-50/20"
                : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            Groom / ஆண்
          </button>
        </div>
      </div>

      <button
          onClick={handleSendOtp}
          disabled={sendingOtp || phone.length !== 10}
          className={`w-full py-3.5 mt-4 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            sendingOtp || phone.length !== 10
              ? "bg-emerald-400 cursor-not-allowed opacity-70"
              : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md"
          }`}
        >
          {sendingOtp ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Sending OTP...</span>
            </>
          ) : (
            <>
              <span>Send OTP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterOtpStep({ onNext, onBack, setPage, otpCode }: { onNext: () => void; onBack: () => void; setPage: (p: Page) => void; otpCode: string }) {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [resending, setResending] = useState(false);
  const [notification, setNotification] = useState(true);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setNotification(true);
    }, 1500);
  };

  const filled = otp.every((d) => d !== "");

  return (
    <div className="space-y-6 relative">
      {/* WhatsApp notification toast */}
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 max-w-xs bg-gray-900 text-white rounded-2xl shadow-2xl p-4 animate-fade-in"
          style={{ animation: "slideInRight 0.4s ease" }}
        >
          <button
            onClick={() => setNotification(false)}
            className="absolute top-3 right-3 text-gray-400 hover:text-white text-lg leading-none bg-transparent border-none cursor-pointer"
          >
            ×
          </button>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.122.549 4.116 1.508 5.855L0 24l6.335-1.483A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.877 0-3.647-.5-5.188-1.377l-.372-.219-3.761.881.923-3.667-.242-.388A9.934 9.934 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-emerald-400 mb-0.5">WhatsApp Notification</p>
              <p className="text-sm font-bold text-white">VivahShaadi OTP Verification</p>
              <p className="text-xs text-gray-300 mt-0.5">Your registration OTP code is: {otpCode}</p>
              <button
                onClick={() => {
                  const filled = [...otpCode];
                  setOtp(filled);
                  setNotification(false);
                }}
                className="mt-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Copy Code
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-2">
        <h2 className="font-display text-2xl font-bold text-slate-800">Verify Mobile</h2>
        <p className="text-sm text-gray-500 mt-1">Enter the 4-digit code sent to your WhatsApp number.</p>
      </div>

      <div className="flex gap-3 justify-center my-4">
        {otp.map((digit, i) => (
          <input
            key={i}
            type="text"
            maxLength={1}
            value={digit}
            id={`reg-otp-${i}`}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              const n = [...otp];
              n[i] = val;
              setOtp(n);
              if (val && i < 3) {
                document.getElementById(`reg-otp-${i + 1}`)?.focus();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !otp[i] && i > 0) {
                document.getElementById(`reg-otp-${i - 1}`)?.focus();
              }
            }}
            className="w-14 h-14 text-center border-2 border-gray-200 rounded-xl text-xl font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white text-slate-800 transition-all"
          />
        ))}
      </div>

      <button
        onClick={onNext}
        disabled={!filled}
        className={`w-full py-3.5 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
          filled ? "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md" : "bg-emerald-300 cursor-not-allowed"
        }`}
      >
        Verify OTP & Continue
      </button>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm"
        >
          Back
        </button>
        <button
          onClick={handleResend}
          disabled={resending}
          className="flex-1 py-3 border border-emerald-200 text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer text-sm disabled:opacity-60"
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterStep2({ onNext, onBack, setPage }: { onNext: () => void; onBack: () => void; setPage: (p: Page) => void }) {
  const [locationGranted, setLocationGranted] = useState(false);
  const [granting, setGranting] = useState(false);
  const [locationLabel, setLocationLabel] = useState("Chennai, Tamil Nadu, India · 600001");
  const [locationError, setLocationError] = useState("");

  const handleGrantLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setGranting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.county ||
            "Your City";
          const state = data.address?.state || "";
          const country = data.address?.country || "India";
          const postcode = data.address?.postcode || "";
          setLocationLabel(`${city}${state ? ", " + state : ""}, ${country}${postcode ? " · " + postcode : ""}`);
        } catch {
          setLocationLabel(`Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`);
        }
        setGranting(false);
        setLocationGranted(true);
      },
      (err) => {
        setGranting(false);
        if (err.code === err.PERMISSION_DENIED) {
          setLocationError("Location access was denied. You can continue without it.");
        } else {
          setLocationError("Unable to retrieve location. Please try again.");
        }
      },
      { timeout: 15000 }
    );
  };

  return (
    <div className="space-y-5">
      <div className="mb-2">
        <h2 className="font-display text-2xl font-bold text-slate-800">Location Verification</h2>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          We require location access to verify your regional profile authenticity and enable accurate horoscope match calculations.
        </p>
      </div>

      {/* Location card */}
      <div className="border border-gray-200 rounded-2xl p-6 flex flex-col items-center gap-3 bg-white">
        {locationGranted ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="font-bold text-slate-800 text-base">Location Access Granted</p>
            <p className="text-sm text-emerald-600 text-center">{locationLabel}</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <MapPin className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
            </div>
            <p className="font-bold text-slate-800 text-base">Enable Location Services</p>
            <p className="text-sm text-emerald-600 text-center leading-relaxed">
              Click the button below to grant location access. This ensures secure and genuine registrations.
            </p>
          </>
        )}

        {locationError && (
          <p className="text-xs text-red-500 text-center px-2">{locationError}</p>
        )}

        <button
          onClick={locationGranted ? onNext : handleGrantLocation}
          disabled={granting}
          className={`w-full py-3.5 mt-1 text-white font-semibold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
            granting
              ? "bg-emerald-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md"
          }`}
        >
          {granting ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Accessing Location...</span>
            </>
          ) : locationGranted ? (
            <><span>Continue</span><ArrowRight className="w-4 h-4" /></>
          ) : (
            <><span>Grant Location Access</span><ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {!locationGranted && (
        <button
          onClick={onNext}
          className="w-full py-2.5 text-gray-400 text-sm hover:text-gray-600 transition-colors cursor-pointer bg-transparent border-none"
        >
          Skip for now →
        </button>
      )}

      <button
        onClick={onBack}
        className="w-full py-3 border border-gray-200 text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors cursor-pointer text-sm"
      >
        Back to OTP
      </button>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-semibold text-emerald-600 hover:text-emerald-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterStep3({ onNext }: { onNext: () => void }) {
  const [locationCaptured, setLocationCaptured] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Location Verification</h2>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          We require location access to verify your regional profile authenticity and enable accurate horoscope match calculations.
        </p>
      </div>

      <div className="bg-slate-50 rounded-3xl p-6 flex flex-col items-center text-center border border-slate-100">
        <div className="w-12 h-12 bg-[#ebf8f4] rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-6 h-6 text-[#34b48d]" />
        </div>
        
        <h3 className="font-bold text-slate-900 text-lg">Enable Location Services</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-[250px] leading-relaxed">
          Click the button below to grant location access. This ensures secure and genuine registrations.
        </p>

        {locationCaptured && (
          <div className="mt-4 px-3 py-1.5 bg-[#ebf8f4] border border-[#a3e6d1] text-[#0f766e] text-xs font-semibold rounded-full flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-[#34b48d]" />
            Location captured! Lat: 10.3576, Lng: 77.9786
          </div>
        )}

        <button 
          onClick={() => {
            if (!locationCaptured) setLocationCaptured(true);
            else onNext();
          }}
          className="w-full mt-6 py-3.5 bg-[#0f766e] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <span>Grant Location Access</span><ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function RegisterStep4({ setPage, onBack }: { setPage: (p: Page) => void; onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Complete Registration</h2>
        <p className="text-sm text-slate-500 mt-1">Upload your profile photo and horoscope document.</p>
      </div>

      <div>
        <div className="flex items-center gap-1.5 text-[#34b48d] font-semibold text-sm mb-3">
          <Sparkles className="w-4 h-4" />
          <span>Horoscope (Jathagam) Document Upload</span>
        </div>
        
        <label 
          onDoubleClick={() => {
            const mockFile = new File(["dummy content"], "mock_horoscope.pdf", { type: "application/pdf" });
            setFile(mockFile);
          }}
          className="border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
          {file ? (
            <>
              <CheckCircle className="w-6 h-6 text-[#34b48d] mb-2" />
              <p className="font-bold text-[#0f766e] text-sm">{file.name}</p>
              <p className="text-xs text-[#34b48d] font-semibold mt-1">Uploaded successfully</p>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-slate-400 mb-2" strokeWidth={1.5} />
              <p className="font-bold text-slate-900 text-sm">Click to upload Horoscope (PDF/Image)</p>
              <p className="text-xs text-[#34b48d] font-semibold mt-1">(Or double-click here for mock testing)</p>
            </>
          )}
        </label>
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={onBack} className="w-1/3 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center cursor-pointer">
          Back
        </button>
        <button onClick={() => setPage("dashboard")} className="flex-1 py-3 bg-[#0f766e] hover:bg-teal-800 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer">
          <span>Register <ArrowRight className="w-4 h-4 ml-1 inline" /></span>
        </button>
      </div>
    </div>
  );
}

function RegisterPage({ step, setStep, setPage }: { step: number; setStep: (s: number) => void; setPage: (p: Page) => void }) {
  const [otpCode, setOtpCode] = useState("4495");

  // Mapping internal steps (1–5) to display steps (1–4)
  // step 1: phone+gender → display 1 | step 2: otp verify → display 1 | step 3 → display 2 | step 4 → display 3 | step 5 → display 4
  const getDisplayStep = (s: number) => s <= 2 ? 1 : s - 1;
  const currentDisplay = getDisplayStep(step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#10b981] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-teal-800">VivahShaadi</span>
          </div>
          <p className="text-gray-500 text-sm">Create your free profile in minutes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100">
          {/* Stepper */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-all duration-300 ${
                    s <= currentDisplay ? "bg-emerald-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-gray-400 tracking-wider">
              STEP {currentDisplay} OF 4
            </span>
          </div>

          {step === 1 && <RegisterStep1 onNext={() => setStep(2)} setPage={setPage} onOtpSent={(code) => setOtpCode(code)} />}
          {step === 2 && <RegisterOtpStep onNext={() => setStep(3)} onBack={() => setStep(1)} setPage={setPage} otpCode={otpCode} />}
          {step === 3 && <RegisterStep2 onNext={() => setStep(4)} onBack={() => setStep(2)} setPage={setPage} />}
          {step === 4 && <RegisterStep3 onNext={() => setStep(5)} />}
          {step === 5 && <RegisterStep4 setPage={setPage} onBack={() => setStep(4)} />}
        </div>
      </div>
    </div>
  );
}

