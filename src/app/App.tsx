import { useState, useEffect,useRef } from "react";
import {
  Heart, Search, Star, Crown, MapPin, Phone, MessageCircle,
  ChevronRight, ChevronLeft, Check, X, User, Bell, Settings,
  LogOut, Users, Shield, CreditCard, Filter, Send, Mic,
  Paperclip, Eye, Edit2, Trash2, Ban, CheckCircle, AlertCircle,
  TrendingUp, Camera, Upload, Home, Menu, ArrowRight, Sparkles,
  BookOpen, Flag, Image as ImgIcon, Globe, Lock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import PhoneInput from 'react-phone-input-2';
import axios from 'axios';

type Page = "landing" | "login" | "register" | "dashboard" | "profile" | "interests" | "chat" | "premium" | "admin";
type AdminSection = "overview" | "users" | "horoscope" | "interests" | "chat" | "reports" | "subscriptions" | "cms" | "settings";

// ─── Data ────────────────────────────────────────────────────────────────────

const PROFILES = [
  { id: 1, name: "Priya Sharma", age: 26, city: "Chennai", state: "Tamil Nadu", religion: "Hindu", caste: "Brahmin", education: "M.Tech", job: "Software Engineer", salary: "12 LPA", height: "5'4\"", complexion: "Fair", match: 87, img: "https://i.pravatar.cc/300?img=47", premium: true, online: true, rasi: "Mesham", nakshatra: "Ashwini", dosham: "None" },
  { id: 2, name: "Ananya Krishnan", age: 24, city: "Coimbatore", state: "Tamil Nadu", religion: "Hindu", caste: "Mudaliar", education: "MBA", job: "Bank Manager", salary: "8 LPA", height: "5'3\"", complexion: "Wheatish", match: 72, img: "https://i.pravatar.cc/300?img=48", premium: false, online: false, rasi: "Rishabam", nakshatra: "Rohini", dosham: "Chevvai Dosham" },
  { id: 3, name: "Divya Nair", age: 27, city: "Bangalore", state: "Karnataka", religion: "Hindu", caste: "Nair", education: "MBBS", job: "Doctor", salary: "18 LPA", height: "5'5\"", complexion: "Fair", match: 94, img: "https://i.pravatar.cc/300?img=49", premium: true, online: true, rasi: "Mithunam", nakshatra: "Thiruvathirai", dosham: "None" },
  { id: 4, name: "Kavitha Reddy", age: 25, city: "Hyderabad", state: "Telangana", religion: "Hindu", caste: "Reddy", education: "B.Tech", job: "Data Analyst", salary: "10 LPA", height: "5'2\"", complexion: "Wheatish", match: 68, img: "https://i.pravatar.cc/300?img=50", premium: false, online: true, rasi: "Katakam", nakshatra: "Pushyam", dosham: "None" },
  { id: 5, name: "Meena Iyer", age: 28, city: "Mumbai", state: "Maharashtra", religion: "Hindu", caste: "Iyer", education: "CA", job: "Chartered Accountant", salary: "15 LPA", height: "5'3\"", complexion: "Fair", match: 81, img: "https://i.pravatar.cc/300?img=51", premium: true, online: false, rasi: "Simmam", nakshatra: "Magam", dosham: "None" },
  { id: 6, name: "Lakshmi Venkat", age: 23, city: "Madurai", state: "Tamil Nadu", religion: "Hindu", caste: "Pillai", education: "B.E.", job: "Teacher", salary: "5 LPA", height: "5'1\"", complexion: "Fair", match: 79, img: "https://i.pravatar.cc/300?img=9", premium: false, online: false, rasi: "Kanni", nakshatra: "Uthiram", dosham: "Sevvai Dosham" },
];

const TESTIMONIALS = [
  { couple: "Karthik & Priya", married: "March 2024", city: "Chennai", story: "We matched on VivahShaadi in 2023. The horoscope match feature was spot on — we are happily married now with our families blessing!", img1: "https://i.pravatar.cc/100?img=12", img2: "https://i.pravatar.cc/100?img=47" },
  { couple: "Rahul & Divya", married: "January 2024", city: "Bangalore", story: "Genuine profiles and easy communication helped us find our perfect match within 3 months. Best decision ever!", img1: "https://i.pravatar.cc/100?img=33", img2: "https://i.pravatar.cc/100?img=49" },
  { couple: "Suresh & Meena", married: "November 2023", city: "Mumbai", story: "From first interest to wedding in just 6 months! The premium membership was worth every rupee.", img1: "https://i.pravatar.cc/100?img=15", img2: "https://i.pravatar.cc/100?img=51" },
];

const PLANS = [
  { name: "Basic", price: "₹999", period: "/3 months", features: ["50 Profile Views/month", "10 Interests/month", "Basic Search Filters", "Email Support"], extras: ["Horoscope Matching", "WhatsApp Unlock", "Priority Listing", "Video Calling", "Dedicated Manager"] },
  { name: "Gold", price: "₹2,499", period: "/6 months", popular: true, features: ["Unlimited Profile Views", "50 Interests/month", "Advanced Filters", "Horoscope Matching", "WhatsApp Number Unlock", "Chat & Voice Notes"], extras: ["Priority Listing", "Video Calling", "Dedicated Manager"] },
  { name: "Premium", price: "₹4,999", period: "/1 year", features: ["Everything in Gold", "Unlimited Interests", "Priority Search Listing", "Dedicated Relationship Manager", "Video Calling", "Premium Profile Badge"], extras: [] },
];

const REG_DATA = [
  { day: "Mon", users: 234 }, { day: "Tue", users: 312 }, { day: "Wed", users: 289 },
  { day: "Thu", users: 401 }, { day: "Fri", users: 356 }, { day: "Sat", users: 478 }, { day: "Sun", users: 523 },
];

const REVENUE_DATA = [
  { month: "Jan", revenue: 1.28 }, { month: "Feb", revenue: 1.45 }, { month: "Mar", revenue: 1.62 },
  { month: "Apr", revenue: 1.89 }, { month: "May", revenue: 2.01 }, { month: "Jun", revenue: 2.34 },
];

const GENDER_DATA = [
  { name: "Male", value: 22104, color: "#7C3AED" },
  { name: "Female", value: 26625, color: "#BE185D" },
];

const USERS_TABLE = [
  { id: "U001", name: "Arun Kumar", gender: "Male", phone: "+91 98765 43210", city: "Chennai", status: "Active", verified: true, premium: false },
  { id: "U002", name: "Priya Devi", gender: "Female", phone: "+91 87654 32109", city: "Coimbatore", status: "Active", verified: true, premium: true },
  { id: "U003", name: "Rajesh Pillai", gender: "Male", phone: "+91 76543 21098", city: "Madurai", status: "Pending", verified: false, premium: false },
  { id: "U004", name: "Sunita Sharma", gender: "Female", phone: "+91 65432 10987", city: "Bangalore", status: "Blocked", verified: true, premium: false },
  { id: "U005", name: "Vikram Nair", gender: "Male", phone: "+91 54321 09876", city: "Mumbai", status: "Active", verified: true, premium: true },
  { id: "U006", name: "Anita Krishnan", gender: "Female", phone: "+91 43210 98765", city: "Hyderabad", status: "Active", verified: false, premium: false },
];

const INTERESTS_DATA = [
  { id: 1, name: "Priya Sharma", age: 26, city: "Chennai", img: "https://i.pravatar.cc/100?img=47", status: "pending", time: "2 hours ago", match: 87 },
  { id: 2, name: "Divya Nair", age: 27, city: "Bangalore", img: "https://i.pravatar.cc/100?img=49", status: "accepted", time: "1 day ago", match: 94 },
  { id: 3, name: "Kavitha Reddy", age: 25, city: "Hyderabad", img: "https://i.pravatar.cc/100?img=50", status: "pending", time: "3 days ago", match: 68 },
  { id: 4, name: "Meena Iyer", age: 28, city: "Mumbai", img: "https://i.pravatar.cc/100?img=51", status: "rejected", time: "5 days ago", match: 81 },
  { id: 5, name: "Ananya Krishnan", age: 24, city: "Coimbatore", img: "https://i.pravatar.cc/100?img=48", status: "accepted", time: "1 week ago", match: 72 },
];

const CHATS_DATA = [
  { id: 1, name: "Divya Nair", img: "https://i.pravatar.cc/100?img=49", lastMsg: "Thank you for your interest!", time: "10:30 AM", unread: 2, online: true },
  { id: 2, name: "Priya Sharma", img: "https://i.pravatar.cc/100?img=47", lastMsg: "Sure, let us talk more!", time: "Yesterday", unread: 0, online: false },
  { id: 3, name: "Ananya Krishnan", img: "https://i.pravatar.cc/100?img=48", lastMsg: "My family will call you soon.", time: "2 days ago", unread: 0, online: false },
];

const MESSAGES_DATA = [
  { id: 1, from: "them", text: "Hello! I saw your profile and I am very interested.", time: "10:00 AM" },
  { id: 2, from: "me", text: "Hi Divya! Thank you for reaching out. I liked your profile too.", time: "10:05 AM" },
  { id: 3, from: "them", text: "Can you tell me more about your family background?", time: "10:10 AM" },
  { id: 4, from: "me", text: "Sure! I am from a Tamil Brahmin family in Chennai. My father is a retired government officer.", time: "10:15 AM" },
  { id: 5, from: "them", text: "That sounds wonderful! My family is originally from Coimbatore.", time: "10:20 AM" },
  { id: 6, from: "them", text: "Thank you for your interest!", time: "10:30 AM" },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
// const [phone, setPhone] = useState("");
// const [otp, setOtp] = useState("");
// const [otpSent, setOtpSent] = useState(false);
// const [sendingOtp, setSendingOtp] = useState(false);
// const [verifyingOtp, setVerifyingOtp] = useState(false);

function MatchBadge({ pct }: { pct: number }) {
  const cls =
    pct >= 85 ? "text-emerald-700 bg-emerald-100" :
    pct >= 70 ? "text-amber-700 bg-amber-100" :
    "text-rose-700 bg-rose-100";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Sparkles className="w-3 h-3" />{pct}% Match
    </span>
  );
}

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-sm">
      <Crown className="w-3 h-3" />Premium
    </span>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ page, setPage }: { page: Page; setPage: (p: Page) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = !["landing", "register", "login"].includes(page);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => setPage("landing")} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-700 flex items-center justify-center shadow-md">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display text-lg font-bold hidden sm:block">
              <span className="text-rose-700">Vivah</span><span className="text-purple-700">Shaadi</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {isLoggedIn ? (
              <>
                {([["dashboard", "Matches"], ["interests", "Interests"], ["chat", "Messages"], ["premium", "Premium"]] as [Page, string][]).map(([p, label]) => (
                  <button key={p} onClick={() => setPage(p)} className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${page === p ? "text-rose-700 bg-rose-50" : "text-gray-600 hover:text-rose-700 hover:bg-rose-50"}`}>{label}</button>
                ))}
                <button className="relative p-2 ml-2 text-gray-500 hover:text-rose-700 transition-colors rounded-lg hover:bg-rose-50">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                </button>
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-rose-100">
                  <img src="https://i.pravatar.cc/40?img=12" alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-rose-200" />
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-gray-800 leading-none">Arun Kumar</p>
                    <p className="text-xs text-amber-600 font-medium mt-0.5">Gold Member</p>
                  </div>
                </div>
                <button onClick={() => setPage("landing")} className="ml-1 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setPage("landing")} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-all">Home</button>
                <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-all">Success Stories</button>
                <button onClick={() => setPage("premium")} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-all">Plans</button>
                <button onClick={() => setPage("admin")} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-all">Admin</button>
                <div className="flex items-center gap-2 ml-2 pl-3 border-l border-rose-100">
                  <button onClick={() => setPage("login")} className="px-4 py-2 text-sm font-semibold text-rose-700 border border-rose-300 rounded-full hover:bg-rose-50 transition-all cursor-pointer">Login</button>
                  <button onClick={() => setPage("register")} className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-600 to-purple-700 rounded-full hover:opacity-90 shadow-sm transition-all cursor-pointer">Register Free</button>
                </div>
              </>
            )}
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-600 rounded-lg hover:bg-rose-50">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-rose-100 pt-3 space-y-1">
            {(["dashboard", "interests", "chat", "premium", "admin"] as Page[]).map((p) => (
              <button key={p} onClick={() => { setPage(p); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-sm text-gray-700 hover:bg-rose-50 rounded-lg capitalize">{p === "dashboard" ? "Matches" : p}</button>
            ))}
            <button onClick={() => { setPage("register"); setMenuOpen(false); }} className="block w-full text-left px-3 py-2.5 text-sm font-semibold text-rose-700">Register Free</button>
          </div>
        )}
      </div>
    </nav>
  );
}

// ─── Landing ──────────────────────────────────────────────────────────────────

function HeroSection({ setPage }: { setPage: (p: Page) => void }) {
  const [gender, setGender] = useState("Bride");
  const [ageMin, setAgeMin] = useState("21");
  const [ageMax, setAgeMax] = useState("30");
  const [religion, setReligion] = useState("");

  return (
    <div className="relative min-h-[620px] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-950 via-purple-950 to-rose-900" />
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: "radial-gradient(ellipse at 70% 30%, #f472b6 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, #a78bfa 0%, transparent 60%)" }} />
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1722952934708-749c22eb2e58?w=900&h=700&fit=crop&auto=format"
          alt="Indian wedding couple"
          className="w-full h-full object-cover object-top opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-950 via-purple-950/80 to-transparent" />
      </div>

      {/* Decorative circles */}
      <div className="absolute top-12 right-12 w-48 h-48 rounded-full border border-white/5 hidden lg:block" />
      <div className="absolute top-6 right-6 w-64 h-64 rounded-full border border-white/5 hidden lg:block" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium border border-white/20">
              <CheckCircle className="w-3 h-3 text-emerald-400" />Verified Profiles
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium border border-white/20">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />4.9 / 5 Rating
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/90 text-xs font-medium border border-white/20">
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />50,000+ Marriages
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            Find Your<br />
            <span className="text-amber-400">Perfect</span> Life<br />
            Partner
          </h1>
          <p className="text-white/70 text-lg mb-8 leading-relaxed">
            Join 5 lakh+ verified profiles across Tamil, Telugu, Kannada & Hindi matrimony — all on one trusted platform.
          </p>

          <div className="flex items-center gap-8 mb-10">
            {[["5L+", "Profiles"], ["50K+", "Marriages"], ["4.9★", "Rating"]].map(([val, label]) => (
              <div key={label}>
                <p className="text-amber-400 font-bold text-2xl font-display leading-none">{val}</p>
                <p className="text-white/55 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Search card */}
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-white/20">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Find Your Match</p>
            <div className="flex gap-2 mb-3">
              {["Bride", "Groom"].map((g) => (
                <button key={g} onClick={() => setGender(g)} className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all ${gender === g ? "bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-sm" : "bg-rose-50 text-rose-700 hover:bg-rose-100"}`}>
                  {g === "Bride" ? "Looking for Bride" : "Looking for Groom"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Min Age</label>
                <select value={ageMin} onChange={e => setAgeMin(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-rose-400 transition-colors">
                  {[18,19,20,21,22,23,24,25,26,27,28,30,32,35].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Max Age</label>
                <select value={ageMax} onChange={e => setAgeMax(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-rose-400 transition-colors">
                  {[25,26,27,28,29,30,32,35,38,40,45].map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-400 mb-1 block">Religion</label>
              <select value={religion} onChange={e => setReligion(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:border-rose-400 transition-colors">
                <option value="">All Religions</option>
                {["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button onClick={() => setPage("dashboard")} className="w-full py-3 bg-gradient-to-r from-rose-600 to-purple-700 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md">
              <Search className="w-4 h-4" />Search Profiles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedProfiles({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">Today's Picks</p>
            <h2 className="font-display text-3xl font-bold text-gray-900">Featured Profiles</h2>
          </div>
          <button onClick={() => setPage("dashboard")} className="flex items-center gap-1 text-sm font-semibold text-rose-700 hover:gap-2 transition-all">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {PROFILES.map(p => (
            <button key={p.id} onClick={() => setPage("profile")} className="group text-left bg-white border border-rose-100 rounded-2xl overflow-hidden hover:shadow-lg hover:border-rose-300 transition-all duration-300">
              <div className="relative aspect-[3/4] bg-rose-50">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {p.premium && (
                  <div className="absolute top-2 left-2"><PremiumBadge /></div>
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-3">
                  <p className="text-white text-sm font-semibold leading-tight">{p.name}</p>
                  <p className="text-white/75 text-xs">{p.age} yrs · {p.city}</p>
                </div>
                <span className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2 border-white ${p.online ? "bg-emerald-400" : "bg-gray-400"}`} />
              </div>
              <div className="p-2">
                <MatchBadge pct={p.match} />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: User, title: "Create Profile", desc: "Register with basic details, upload photo, and add your horoscope details." },
    { icon: Search, title: "Find Matches", desc: "Browse verified profiles filtered by religion, caste, location, and horoscope." },
    { icon: Heart, title: "Send Interest", desc: "Express interest and start chatting after mutual acceptance." },
    { icon: CheckCircle, title: "Get Married", desc: "Meet families, finalize the alliance, and begin your happily ever after!" },
  ];
  return (
    <section className="py-16 bg-gradient-to-br from-rose-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Simple Process</p>
          <h2 className="font-display text-3xl font-bold text-gray-900">Find Love in 4 Simple Steps</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={i} className="relative text-center group">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-3/4 w-1/2 border-t-2 border-dashed border-rose-200 z-0" />
              )}
              <div className="relative z-10 w-20 h-20 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-4 border border-rose-100 group-hover:shadow-rose-200 group-hover:shadow-lg transition-shadow">
                <s.icon className="w-8 h-8 text-rose-600" />
                <span className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">{i + 1}</span>
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlansSection({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Membership</p>
          <h2 className="font-display text-3xl font-bold text-gray-900">Choose Your Plan</h2>
          <p className="text-gray-500 mt-2">Upgrade to connect with more matches faster</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {PLANS.map((plan, i) => (
            <div key={i} className={`relative rounded-2xl border-2 p-6 ${plan.popular ? "border-amber-400 bg-gradient-to-b from-amber-50 to-white shadow-xl shadow-amber-100" : "border-rose-100 bg-white hover:border-rose-300 hover:shadow-md transition-all"}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full shadow">✨ Most Popular</div>
              )}
              <div className="flex items-center gap-2 mb-2">
                {i === 0 ? <Shield className="w-5 h-5 text-gray-400" /> : i === 1 ? <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> : <Crown className="w-5 h-5 text-purple-600" />}
                <h3 className="font-display text-xl font-bold text-gray-900">{plan.name}</h3>
              </div>
              <div className="flex items-end gap-1 mb-5">
                <span className="font-display text-3xl font-bold text-rose-700">{plan.price}</span>
                <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-5">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-600" />
                    </div>
                    {f}
                  </li>
                ))}
                {plan.extras.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-400 line-through">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <X className="w-2.5 h-2.5 text-gray-300" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={() => setPage("premium")} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 shadow-md shadow-amber-200" : i === 2 ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white hover:opacity-90" : "border-2 border-rose-300 text-rose-700 hover:bg-rose-50"}`}>
                {i === 0 ? "Get Started Free" : `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HoroscopeSection() {
  const [rasi, setRasi] = useState("Mesham");
  const [partnerRasi, setPartnerRasi] = useState("Rishabam");
  const rasis = ["Mesham","Rishabam","Mithunam","Katakam","Simmam","Kanni","Thulam","Viruchigam","Dhanusu","Makaram","Kumbam","Meenam"];
  return (
    <section className="py-16 bg-gradient-to-br from-purple-950 via-rose-950 to-purple-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #f9a8d4 0%, transparent 50%), radial-gradient(circle at 80% 20%, #c4b5fd 0%, transparent 50%)" }} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Jyothisham</p>
          <h2 className="font-display text-3xl font-bold text-white">Horoscope Compatibility Check</h2>
          <p className="text-white/55 mt-2">Match your Rasi & Nakshatra for a divinely blessed union</p>
        </div>
        <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            {[["Your Rasi", rasi, setRasi], ["Partner Rasi", partnerRasi, setPartnerRasi]].map(([label, val, setter]) => (
              <div key={label as string}>
                <label className="text-white/75 text-sm font-medium mb-2 block">{label as string}</label>
                <select value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)} className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition-colors">
                  {rasis.map(r => <option key={r} className="text-gray-900 bg-white">{r}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md shadow-amber-900/30">
            <Sparkles className="w-4 h-4" />Check Compatibility
          </button>
          <div className="mt-4 p-5 bg-white/10 rounded-xl text-center border border-white/10">
            <p className="text-white/55 text-xs mb-2 uppercase tracking-wide">Compatibility Score</p>
            <p className="text-5xl font-bold text-amber-400 font-display leading-none">82%</p>
            <p className="text-white/75 text-sm mt-2">Good Match · 7 out of 10 Poruthams aligned</p>
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              {["Dina Porutham ✓", "Rasi Porutham ✓", "Gana Porutham ✓", "Rajju Porutham ✓"].map(p => (
                <span key={p} className="px-2 py-0.5 bg-emerald-400/20 text-emerald-300 text-xs rounded-full">{p}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="py-16 bg-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mb-2">Success Stories</p>
          <h2 className="font-display text-3xl font-bold text-gray-900">50,000+ Happy Couples</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex -space-x-3">
                  <img src={t.img1} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                  <img src={t.img2} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{t.couple}</p>
                  <p className="text-gray-400 text-xs">{t.married} · {t.city}</p>
                </div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                </div>
              </div>
              <div className="relative pl-4">
                <span className="absolute -top-2 left-0 text-4xl text-rose-200 font-display leading-none">"</span>
                <p className="text-gray-600 text-sm leading-relaxed">{t.story}</p>
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 font-medium">Verified Success Story</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-purple-700 flex items-center justify-center">
                <Heart className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="font-display font-bold text-lg">VivahShaadi</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">India's most trusted matrimony platform with 5 lakh+ verified profiles across all communities.</p>
            <div className="flex gap-2">
              {["FB", "TW", "IG", "YT"].map(s => (
                <div key={s} className="w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center text-xs font-bold text-gray-400 hover:bg-rose-600 hover:text-white cursor-pointer transition-colors">{s}</div>
              ))}
            </div>
          </div>
          {[
            { title: "Quick Links", links: ["Home", "Register Free", "Success Stories", "Premium Plans", "Blog"] },
            { title: "Community", links: ["Hindu Matrimony", "Muslim Matrimony", "Christian Matrimony", "Tamil Matrimony", "Telugu Matrimony"] },
            { title: "Support", links: ["Help Center", "Privacy Policy", "Terms of Service", "Fraud Alert", "Contact Us"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l}><a href="#" className="text-gray-400 text-sm hover:text-rose-400 transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">© 2024 VivahShaadi. All rights reserved. Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline mx-0.5" />in India.</p>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />+91 1800 123 4567</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" />support@vivahshaadi.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function LandingPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="font-body">
      <HeroSection setPage={setPage} />
      <FeaturedProfiles setPage={setPage} />
      <HowItWorks />
      <PlansSection setPage={setPage} />
      <HoroscopeSection />
      <TestimonialsSection />
      <Footer setPage={setPage} />
    </div>
  );
}

// ─── Registration ─────────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SelectInput({ label, options, placeholder }: { label: string; options: string[]; placeholder?: string }) {
  return (
    <FieldGroup label={label}>
      <select className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors">
        <option value="">{placeholder ?? `Select ${label}`}</option>
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </FieldGroup>
  );
}

function TextInput({ label, type = "text", placeholder }: { label: string; type?: string; placeholder?: string }) {
  return (
    <FieldGroup label={label}>
      <input type={type} placeholder={placeholder} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-rose-400 focus:bg-white transition-colors" />
    </FieldGroup>
  );
}

function RegisterStep1({ onNext, setPage, onOtpSent }: { onNext: (phone: string, gender: string) => void; setPage: (p: Page) => void; onOtpSent: (code: string) => void }) {
  const [sendingOtp, setSendingOtp] = useState(false);
  const [gender, setGender] = useState<"male" | "female">("female");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const [error, setError] = useState<string | null>(null);

const handleSendOtp = async () => {
    setError(null);
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    
    setSendingOtp(true);
    try {
      const response = await fetch("https://matrimony-website-otp-backend.onrender.com/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();

      // Check if the phone number is already registered (409 Conflict or custom backend flag)
      if (response.status === 409 || data.isRegistered) {
        setError(data.message || "This phone number is already registered. Please log in instead.");
        return; // Stop execution so OTP is not sent/triggered
      }

      if (data.success) {
        setOtpSent(true);
      } else {
        setError(data.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.log(err);
      // For demo purposes when backend is down
      setOtpSent(true);
    } finally {
      setSendingOtp(false); // Ensures loading state always clears
    }
  };
  
  const verifyOtp = async () => {
  const enteredOtp = otp.join("");

  if (enteredOtp.length !== 4) {
    alert("Please enter a valid OTP");
    return;
  }

  setVerifyingOtp(true);

  try {
    const response = await fetch(
      "https://matrimony-website-otp-backend.onrender.com/api/otp/verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          otp: enteredOtp,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      onOtpSent(enteredOtp);
      setIsVerified(true);

      if (data.isRegistered) {
        localStorage.setItem("vivahUser", JSON.stringify(data.user));
        setPage("dashboard");
      }
    } else {
      alert(data.message || "Invalid OTP");
    }
  } catch (err) {
    console.error(err);
  } finally {
    setVerifyingOtp(false);
  }
};
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
        <p className="text-sm text-gray-500 mt-1">Provide details, verify WhatsApp, and upload documents.</p>
      </div>

      <div>
        <label className="block text-sm text-slate-700 mb-2">WhatsApp Number</label>
        <div className="flex gap-3">
          <div className="flex items-center px-4 py-3 border border-gray-200 rounded-[2rem] bg-gray-50/50 text-sm font-semibold text-gray-700 flex-shrink-0">
            <span className="text-xs mr-1 text-gray-500">IN</span> +91
          </div>
          <input
            type="tel"
            maxLength={10}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              if (error) setError(null);
            }}
            placeholder="9876543210"
            disabled={isVerified}
            className={`flex-1 px-4 py-3 rounded-[2rem] text-sm transition-all min-w-0 placeholder:text-gray-400 focus:outline-none focus:bg-white
              ${error ? "border-[#e11d48] bg-rose-50/30 focus:border-[#e11d48]" : isVerified ? "border-[#a7f3d0] bg-[#ebfbf3] text-slate-800 focus:border-[#a7f3d0]" : "border-gray-200 bg-gray-50/50 text-slate-800 focus:border-rose-400"}`}
          />
          {isVerified ? (
            <div className="px-6 py-3 rounded-[2rem] border border-[#a7f3d0] bg-[#ebfbf3] text-[#047857] font-semibold flex items-center justify-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4" /> Verified
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sendingOtp || phone.length !== 10}
              className={`px-6 py-3 rounded-[2rem] text-white font-semibold transition-all text-sm shadow-sm
                ${
                  sendingOtp || phone.length !== 10
                    ? "bg-rose-400 cursor-not-allowed"
                    : "bg-[#e11d48] hover:bg-rose-700"
                }`}
            >
              {otpSent ? "Resend" : sendingOtp ? "Sending..." : "Send OTP"}
            </button>
          )}
        </div>
        
        {error && (
          <p className="mt-2.5 text-sm font-medium text-[#e11d48] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> {error}
          </p>
        )}

        {otpSent && !isVerified && (
          <div className="mt-4 p-5 bg-[#ebfbf3] border border-[#a7f3d0] rounded-[1.5rem]">
            <p className="flex items-center gap-2 text-[#047857] font-medium mb-4">
              <CheckCircle className="w-5 h-5" /> OTP sent to your WhatsApp:
            </p>
            <div className="flex justify-center gap-4 mb-5">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    const newOtp = [...otp];
                    newOtp[index] = value;
                    setOtp(newOtp);
                    if (value && index < 3) {
                      document.getElementById(`otp-${index + 1}`)?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      document.getElementById(`otp-${index - 1}`)?.focus();
                    }
                  }}
                  className="w-14 h-14 border border-[#6ee7b7] bg-white rounded-[1rem] text-center text-xl font-bold text-slate-800 focus:outline-none focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={verifyOtp}
              disabled={verifyingOtp}
              className="w-full py-3.5 bg-[#059669] hover:bg-[#047857] text-white rounded-full font-semibold transition-colors"
            >
              {verifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <User className="w-4 h-4 text-[#9333ea]" /> Gender
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setGender("male")}
            className={`py-6 px-4 text-center rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-4 cursor-pointer ${
              gender === "male"
                ? "border-rose-500 bg-white shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${gender === "male" ? "bg-rose-50" : "bg-gray-100"}`}>
              <User className={`w-6 h-6 ${gender === "male" ? "text-rose-500" : "text-gray-400"}`} />
            </div>
            <span className={`font-semibold text-sm ${gender === "male" ? "text-slate-900" : "text-slate-600"}`}>Male</span>
          </button>
          <button
            type="button"
            onClick={() => setGender("female")}
            className={`py-6 px-4 text-center rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-4 cursor-pointer ${
              gender === "female"
                ? "border-rose-500 bg-white shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${gender === "female" ? "bg-rose-50" : "bg-gray-100"}`}>
              <User className={`w-6 h-6 ${gender === "female" ? "text-rose-500" : "text-gray-400"}`} />
            </div>
            <span className={`font-semibold text-sm ${gender === "female" ? "text-slate-900" : "text-slate-600"}`}>Female</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => onNext(phone, gender)}
        disabled={!isVerified}
        className="w-full py-4 mt-6 text-white font-semibold rounded-[2rem] shadow-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#e11d48] to-[#9333ea] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>

      <div className="text-center mt-6 pt-4">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-bold text-[#e11d48] hover:text-rose-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
function RegisterStep2({ 
  onNextWithData, 
  onBack, 
  setPage,
  updateFormFields // Optional: pass a setter or field updater from parent
}: { 
  onNextWithData: (ocrText: string, ocrFields: Record<string,string>, file: File | null) => void; 
  onBack: () => void; 
  setPage: (p: Page) => void;
  updateFormFields?: (fields: Record<string, string>) => void;
}) {

  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [ocrFields, setOcrFields] = useState<Record<string,string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processFile(selectedFile);
    }
  };

const processFile = async (file: File) => {
  setIsProcessing(true);
  setOcrText("");
  setOcrFields({});

  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("https://matrimony-website-o3sg.onrender.com/ocr", {
      method: "POST",
      body: formData,
    });

    console.log("Status:", response.status);
    console.log("OK:", response.ok);

    if (response.ok) {
      const data = await response.json();
      console.log("FULL API RESPONSE:", data);
      console.log("EXTRACTED FIELDS:", data.fields);

      setOcrText(data.text || "");
      
      const safeFields = data.fields || {};
      setOcrFields(safeFields);

      // Pass fields cleanly to parent via callback
      if (typeof updateFormFields === "function") {
        updateFormFields(safeFields);
      }

      // Transition data handler safely
      onNextWithData(data.text || "", safeFields, file);
    } else {
      console.warn("OCR endpoint returned non-OK status, proceeding with file attached.");
    }
  } catch (error) {
    console.log("OCR processing skipped, but file is saved for registration:", error);
  } finally {
    setIsProcessing(false);
  }
};

const handleContinue = () => {
    onNextWithData(ocrText, ocrFields, file);
  };

 return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
        <p className="text-sm text-gray-500 mt-1">Provide details, verify WhatsApp, and upload documents.</p>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-3">
          <Sparkles className="w-4 h-4 text-[#9333ea]" /> Horoscope (Jathagam) Document Upload (Optional)
        </label>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf" 
          className="hidden" 
        />
        
        {file ? (
          <div className="flex items-center justify-between p-4 bg-[#ebfbf3] border border-[#a7f3d0] rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border border-gray-100">
                {file.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(file)} alt="thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-800">{file.name}</span>
                <span className="text-xs text-[#059669] mt-0.5">
                  {(file.size / (1024 * 1024)) < 1 ? (file.size / 1024).toFixed(0) + " KB" : (file.size / (1024 * 1024)).toFixed(1) + " MB"} • {isProcessing ? "Scanning..." : "Linked & Verification Pending"}
                </span>
              </div>
            </div>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setFile(null); setOcrText(""); }}
              className="p-2 text-[#059669] hover:bg-[#d1fae5] rounded-full transition-colors cursor-pointer flex-shrink-0"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-[1.5rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#9333ea] hover:bg-purple-50/30 transition-colors relative overflow-hidden"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 mb-1">Click to upload Horoscope (PDF/Image) - Optional</p>
            <p className="text-xs text-gray-400 max-w-[250px] mx-auto">Upload Horoscope Image or PDF from device (max 5MB, or skip by clicking Continue below)</p>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={onBack}
          className="flex-1 py-4 border border-gray-200 text-slate-700 font-semibold rounded-[2rem] hover:bg-gray-50 transition-colors text-sm"
        >
          Back
        </button>
<button
  onClick={() => handleContinue()}
  disabled={isProcessing}
  className="flex-[2] py-4 text-white font-semibold rounded-[2rem] shadow-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#e11d48] to-[#9333ea] hover:opacity-90 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
>
  {isProcessing ? (
    "Scanning..."
  ) : (
    <>
      Continue <ArrowRight className="w-4 h-4" />
    </>
  )}
</button>      </div>

      <div className="text-center mt-6 pt-4">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button
            onClick={() => setPage("login")}
            className="font-bold text-[#e11d48] hover:text-rose-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

// ─── OCR Field Extractor ────────────────────────────────────────────────────
function extractFieldsFromOcr(text: string) {
  const extract = (patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = text.match(p);
      if (m) return (m[1] || m[0]).trim();
    }
    return "";
  };
  return {
    name: extract([/(?:Name|பெயர்)[\s:\-]+([^\n]+)/i, /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}(?:\s+[A-Z])?)$/m]),
    dob: extract([/(?:dob|date of birth|birth date|பிறந்த தேதி)[\s:\-]+([^\n]+)/i, /\b(\d{2}[-\/]\d{2}[-\/]\d{4})\b/]),
    birthTime: extract([/(?:birth time|time|பிறந்த நேரம்)[\s:\-]+([^\n]+)/i, /\b(\d{2}[:\d]*\s*(?:AM|PM|am|pm))\b/i]),
    birthPlace: extract([/(?:birth place|born at|பிறந்த இடம்)[\s:\-]+([^\n]+)/i]),
    phone: extract([/(?:phone|mobile|contact)[\s:\-]+([^\n]+)/i, /\b(\d{10})\b/]),
    email: extract([/(?:email|e-mail)[\s:\-]+([^\n]+)/i, /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/]),
    rasi: extract([/(?:rasi|raasi|ராசி)[\s:\-]+([^\n]+)/i, /\b(Mesham|Rishabam|Mithunam|Kadagam|Simmam|Kanni|Thulam|Viruchigam|Dhanusu|Magaram|Kumbam|Meenam)\b/i]),
    nakshatra: extract([/(?:nakshatra|star|நட்சத்திரம்)[\s:\-]+([^\n]+)/i, /\b(Ashwini|Bharani|Krithika|Rohini|Mrigasira|Arudra|Punarvasu|Pushya|Aslesha|Magha|Pooram|Uttram|Hastam|Chithirai|Swathi|Visagam|Anusham|Jyeshta|Moolam|Pooradam|Uttaradam|Sravanam|Avittam|Sathayam|Poorattadhi|Uttarattadhi|Revathi)\b/i]),
    dosham: extract([/(?:dosham|dosam|தோஷம்)[\s:\-]+([^\n]+)/i]) || "None",
    gotra: extract([/(?:gotra|gotram)[\s:\-]+([^\n]+)/i]),
    motherTongue: extract([/(?:mother tongue|language)[\s:\-]+([^\n]+)/i]),
    religion: extract([/(?:religion|மதம்)[\s:\-]+([^\n]+)/i]),
    caste: extract([/(?:caste|community|சாதி)[\s:\-]+([^\n]+)/i]),
    subCaste: extract([/(?:sub.?caste)[\s:\-]+([^\n]+)/i]),
    familyType: extract([/(?:family type)[\s:\-]+([^\n]+)/i]),
    height: extract([/(?:height)[\s:\-]+([^\n]+)/i]),
    weight: extract([/(?:weight)[\s:\-]+([^\n]+)/i]),
    complexion: extract([/(?:complexion|skin)[\s:\-]+([^\n]+)/i]),
    bloodGroup: extract([/(?:blood|blood group)[\s:\-]+([^\n]+)/i]),
    annualIncome: extract([/(?:income|salary)[\s:\-]+([^\n]+)/i]),
    education: extract([/(?:education|qualification)[\s:\-]+([^\n]+)/i]),
    occupation: extract([/(?:occupation|job)[\s:\-]+([^\n]+)/i]),
    fatherName: extract([/(?:father'?s? name)[\s:\-]+([^\n]+)/i]),
    fatherJob: extract([/(?:father'?s? (?:job|occupation))[\s:\-]+([^\n]+)/i]),
    motherName: extract([/(?:mother'?s? name)[\s:\-]+([^\n]+)/i]),
    motherJob: extract([/(?:mother'?s? (?:job|occupation))[\s:\-]+([^\n]+)/i]),
    brotherName: extract([/(?:brothers?)[\s:\-]+([^\n]+)/i]),
    sisterName: extract([/(?:sisters?)[\s:\-]+([^\n]+)/i]),
    city: extract([/(?:city)[\s:\-]+([^\n]+)/i]),
    state: extract([/(?:state)[\s:\-]+([^\n]+)/i]),
    country: extract([/(?:country)[\s:\-]+([^\n]+)/i]) || "India",
    address: extract([/(?:address)[\s:\-]+([^\n]+)/i]),
  };
}

// ─── Register Form Details (Step 3 — OCR-filled editable form) ──────────────
function RegisterFormDetails({ ocrText, ocrFields, horoscopeFile, phone, gender, onBack, onComplete, setPage }:
  { ocrText: string; ocrFields: Record<string,string>; horoscopeFile: File | null; phone: string; gender: string; onBack: () => void; onComplete: () => void; setPage: (p: Page) => void }) {

  // Merge: backend structured fields take priority, then frontend regex fallback on raw text
  const rx = extractFieldsFromOcr(ocrText);
  const f = ocrFields; // shorthand for backend fields
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

const safeOcr = rx || {};
const safeForm = f || {};

const [form, setForm] = useState({
  name: safeForm.name || safeOcr.name || "",
  email: safeForm.email || safeOcr.email || "",
  dob: safeForm.dob || safeOcr.dob || "",
  birthTime: safeForm.birth_time || safeOcr.birthTime || "",
  birthPlace: safeForm.birth_place || safeOcr.birthPlace || "",
  contactPhone: safeForm.phone || safeOcr.phone || phone || "",
  rasi: safeForm.rasi || safeOcr.rasi || "Mesham",
  nakshatra: safeForm.nakshatra || safeOcr.nakshatra || "Rohini",
  dosham: safeForm.dosham || safeOcr.dosham || "None",
  gotra: safeForm.gotra || safeOcr.gotra || "",
  motherTongue: safeForm.mother_tongue || safeOcr.motherTongue || "Tamil",
  religion: safeForm.religion || safeOcr.religion || "Hindu",
  caste: safeForm.caste || safeOcr.caste || "",
  subCaste: safeForm.sub_caste || safeOcr.subCaste || "",
  familyType: safeForm.family_type || safeOcr.familyType || "Joint Family",
  height: safeForm.height || safeOcr.height || "",
  weight: safeForm.weight || safeOcr.weight || "",
  complexion: safeForm.complexion || safeOcr.complexion || "Fair",
  bloodGroup: safeForm.blood_group || safeOcr.bloodGroup || "",
  annualIncome: safeForm.annual_income || safeOcr.annualIncome || "",
  education: safeForm.education || safeOcr.education || "",
  occupation: safeForm.occupation || safeOcr.occupation || "",
  fatherName: safeForm.father_name || safeOcr.fatherName || "",
  fatherJob: safeForm.father_job || safeOcr.fatherJob || "",
  motherName: safeForm.mother_name || safeOcr.motherName || "",
  motherJob: safeForm.mother_job || safeOcr.motherJob || "",
  brotherName: safeForm.brother || safeOcr.brotherName || "",
  sisterName: safeForm.sister || safeOcr.sisterName || "",
  city: safeForm.city || safeOcr.city || "",
  state: safeForm.state || safeOcr.state || "",
  country: safeForm.country || safeOcr.country || "India",
  address: safeForm.address || safeOcr.address || "",
});
  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

const handleSubmit = async () => {
    if (!form.name) {
        alert("Full name is required.");
        return;
    }

    setSubmitting(true);

    try {
        const formData = new FormData();

        Object.entries(form).forEach(([k, v]) => {
            formData.append(k, v);
        });

        formData.append("phone", phone);
        formData.append("gender", gender);

        if (horoscopeFile) {
            formData.append("horoscope", horoscopeFile);
        }

        const res = await fetch("https://matrimony-website-otp-backend.onrender.com/api/register", {
    method: "POST",
    body: formData
});

const data = await res.json();

        // Handle already registered phone number (409 Conflict)
        if (res.status === 409) {
            setErrorMessage(data.message || "This phone number is already registered.");
            return;
        }

        if (!res.ok) {
            throw new Error(data.message || "Registration failed");
        }

        // Handle successful registration
        localStorage.setItem("vivahUser", JSON.stringify(data.user));
        alert("Registration Successful!");
        onComplete();

    } catch (err) {
        console.error("Error during registration:", err);
        setErrorMessage(err.message || "Unable to connect to the server.");
    } finally {
        setSubmitting(false);
    }
};
  const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
      <span className="text-[#9333ea]">{icon}</span>
      <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">{title}</h3>
    </div>
  );

  const Fld = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}{req && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  const inp = (fk: string, ph?: string, tp = "text") => (
    <input type={tp} value={(form as Record<string, string>)[fk]} onChange={set(fk)} placeholder={ph}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-[#9333ea] focus:bg-white transition-colors" />
  );

  const sel = (fk: string, opts: string[]) => (
    <select value={(form as Record<string, string>)[fk]} onChange={set(fk)}
      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-[#9333ea] focus:bg-white transition-colors">
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
  );

  const RASI = ["Mesham","Rishabam","Mithunam","Kadagam","Simmam","Kanni","Thulam","Viruchigam","Dhanusu","Magaram","Kumbam","Meenam"];
  const NAKSHATRA = ["Ashwini","Bharani","Krithika","Rohini","Mrigasira","Arudra","Punarvasu","Pushya","Aslesha","Magha","Pooram","Uttram","Hastam","Chithirai","Swathi","Visagam","Anusham","Jyeshta","Moolam","Pooradam","Uttaradam","Sravanam","Avittam","Sathayam","Poorattadhi","Uttarattadhi","Revathi"];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800">Register Free</h2>
        <p className="text-sm text-gray-500 mt-1">Provide details, verify WhatsApp, and upload documents.</p>
      </div>

      {/* OCR Banner */}
      <div className="flex items-start gap-3 p-4 bg-purple-50 border border-purple-100 rounded-2xl">
        <Sparkles className="w-4 h-4 text-[#9333ea] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-purple-700">Form &amp; Horoscope Details Review</p>
          <p className="text-xs text-purple-500 mt-0.5">Please review, correct, or fill in the matrimony form details. These are extracted via OCR and will be saved to your profile.</p>
        </div>
      </div>

      {/* Basic Information */}
      <div>
        <SectionTitle icon={<User className="w-4 h-4" />} title="Basic Information" />
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Full Name" req>{inp("name","")}</Fld>
          <Fld label="Email ID" req>{inp("email","","email")}</Fld>
          <Fld label="Date of Birth">{inp("dob","")}</Fld>
          <Fld label="Birth Time">{inp("birthTime","")}</Fld>
          <Fld label="Birth Place">{inp("birthPlace","")}</Fld>
          <Fld label="Contact Phone">{inp("contactPhone","","")}</Fld>
        </div>
      </div>

      {/* Horoscope + Physical side by side */}
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <SectionTitle icon={<Heart className="w-4 h-4" />} title="Horoscope &amp; Community" />
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Fld label="Rasi">{sel("rasi", RASI)}</Fld>
            <Fld label="Nakshatra">{sel("nakshatra", NAKSHATRA)}</Fld>
            <Fld label="Dosham">{sel("dosham", ["None","Chevvai","Raghu","Ketu","Shani"])}</Fld>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Fld label="Gotra">{inp("gotra","Gotra")}</Fld>
            <Fld label="Mother Tongue">{inp("motherTongue","Tamil")}</Fld>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Fld label="Religion">{sel("religion",["Hindu","Muslim","Christian","Jain","Buddhist","Sikh","Other"])}</Fld>
            <Fld label="Caste">{inp("caste","kulam/Gothra")}</Fld>
            <Fld label="Sub Caste">{inp("subCaste","e.g. Kongu Go")}</Fld>
          </div>
          <Fld label="Family Type">{sel("familyType",["Joint Family","Nuclear Family","Extended Family"])}</Fld>
        </div>

        <div>
          <SectionTitle icon={<Star className="w-4 h-4" />} title="Physical &amp; Professional" />
          <div className="grid grid-cols-3 gap-2 mb-3">
            <Fld label="Height">{inp("height","")}</Fld>
            <Fld label="Weight">{inp("weight","")}</Fld>
            <Fld label="Complexion">{sel("complexion",["Very Fair","Fair","Wheatish","Wheatish Brown","Dark"])}</Fld>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Fld label="Blood Group">{inp("bloodGroup","")}</Fld>
            <Fld label="Annual Income">{inp("annualIncome","")}</Fld>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Fld label="Education">{inp("education","")}</Fld>
            <Fld label="Occupation">{inp("occupation","")}</Fld>
          </div>
        </div>
      </div>

      {/* Family Background */}
      <div>
        <SectionTitle icon={<Users className="w-4 h-4" />} title="Family Background" />
        <div className="grid grid-cols-2 gap-4">
          <Fld label="Father's Name">{inp("fatherName","")}</Fld>
          <Fld label="Father's Job">{inp("fatherJob","")}</Fld>
          <Fld label="Mother's Name">{inp("motherName","")}</Fld>
          <Fld label="Mother's Job">{inp("motherJob","")}</Fld>
          <Fld label="Brother's Name">{inp("brotherName","")}</Fld>
          <Fld label="Sister's Name">{inp("sisterName","")}</Fld>
        </div>
      </div>
 
      {/* Contact & Location */}
      <div>
        <SectionTitle icon={<MapPin className="w-4 h-4" />} title="Contact &amp; Location Details" />
        <div className="grid grid-cols-3 gap-4 mb-4">
          <Fld label="City">{inp("city","")}</Fld>
          <Fld label="State">{inp("state","Tamil Nadu")}</Fld>
          <Fld label="Country">{inp("country","India")}</Fld>
        </div>
        <Fld label="Residential Address">
          <textarea value={form.address} onChange={set("address")}
            placeholder="3, Galaxy Apartments, BJ Road Band Stand, Bandra West, Mumbai, Maharashtra"
            rows={2} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-sm text-slate-800 focus:outline-none focus:border-[#9333ea] focus:bg-white transition-colors resize-none" />
        </Fld>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-2">
        <button onClick={onBack}
          className="flex-1 py-4 border border-gray-200 text-slate-700 font-semibold rounded-[2rem] hover:bg-gray-50 transition-colors text-sm">
          Back
        </button>
        <button onClick={handleSubmit} disabled={submitting}
          className="flex-[2] py-4 text-white font-semibold rounded-[2rem] shadow-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#e11d48] to-[#9333ea] hover:opacity-90 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
          {submitting
            ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Saving...</>
            : <>Complete Registration <CheckCircle className="w-4 h-4" /></>}
        </button>
      </div>

      <div className="text-center pt-2">
        <p className="text-sm text-gray-500">
          Already have an account?{" "}
          <button onClick={() => setPage("login")}
            className="font-bold text-[#e11d48] hover:text-rose-700 transition-colors bg-transparent border-none p-0 cursor-pointer">
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterStep3({ onNext, onBack, setPage }: { onNext: () => void; onBack: () => void; setPage: (p: Page) => void }) {
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

function RegisterStep4({ onBack, onRegister }: { onBack: () => void, onRegister: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploaded(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Complete Registration</h2>
        <p className="text-sm text-gray-500 mt-1">Upload your profile photo and horoscope document.</p>
        <div className="mt-4 flex items-center gap-2 text-emerald-600 font-semibold">
          <Sparkles className="w-5 h-5" />
          <span>Horoscope (Jathagam) Document Upload</span>
        </div>
      </div>

      {/* Upload Zone */}
      {!uploaded ? (
        <label className="block w-full border-2 border-dashed border-gray-200 rounded-2xl p-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center">
          <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" />
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <p className="text-sm font-semibold text-gray-700">Click to upload Horoscope (PDF/Image)</p>
          <p className="text-xs text-gray-400 mt-1">(Or double-click here for mock testing)</p>
        </label>
      ) : (
        <div className="w-full border-2 border-dashed border-emerald-300 rounded-2xl p-6 bg-emerald-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-sm font-bold text-emerald-800">Horoscope Uploaded!</p>
              <p className="text-xs text-emerald-600">{file?.name}</p>
            </div>
          </div>
          <button onClick={() => setUploaded(false)} className="text-gray-400 hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {/* <div className="grid grid-cols-2 gap-4">
        <button onClick={onBack} className="py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
          Back
        </button>
        <button onClick={onRegister} className="py-3.5 rounded-xl bg-[#1b6b55] text-white font-semibold hover:bg-[#155a47] flex items-center justify-center gap-2">
          Register →
        </button>
      </div> */}  
    </div>
  );
}

// function RegisterStep4() {
//   const [photoUploaded, setPhotoUploaded] = useState(false);
//   const [horoscopeUploaded, setHoroscopeUploaded] = useState(false);
//   return (
//     <div className="space-y-5">
//       <div className="mb-3">
//         <h2 className="font-display text-xl font-bold text-gray-900">Profile & Horoscope</h2>
//         <p className="text-sm text-gray-500">Complete your profile with photo and horoscope details</p>
//       </div>
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
//         <div className="flex items-center gap-4">
//           <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-rose-50 border-2 border-dashed border-rose-200 flex items-center justify-center flex-shrink-0">
//             {photoUploaded
//               ? <img src="https://i.pravatar.cc/100?img=12" alt="Profile" className="w-full h-full object-cover" />
//               : <Camera className="w-6 h-6 text-rose-300" />}
//           </div>
//           <div>
//             <button onClick={() => setPhotoUploaded(true)} className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-semibold hover:bg-rose-100 transition-colors">
//               <Upload className="w-4 h-4" />{photoUploaded ? "Change Photo" : "Upload Photo"}
//             </button>
//             <p className="text-xs text-gray-400 mt-1.5">JPG, PNG up to 5MB. Clear face photo preferred.</p>
//           </div>
//         </div>
//       </div>
//       <div>
//         <label className="block text-sm font-medium text-gray-700 mb-2">Horoscope / Jathagam</label>
//         <button onClick={() => setHoroscopeUploaded(true)} className={`w-full py-7 rounded-xl border-2 border-dashed transition-all flex flex-col items-center gap-2 ${horoscopeUploaded ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-rose-300 hover:bg-rose-50"}`}>
//           {horoscopeUploaded
//             ? <><CheckCircle className="w-8 h-8 text-emerald-500" /><p className="text-sm font-semibold text-emerald-700">Horoscope Uploaded!</p><p className="text-xs text-gray-500">jathagam_2024.pdf · OCR extraction complete</p></>
//             : <><ImgIcon className="w-8 h-8 text-gray-300" /><p className="text-sm font-semibold text-gray-600">Upload Horoscope Image or PDF</p><p className="text-xs text-gray-400">We will auto-extract Rasi, Nakshatra, Dosham details</p></>}
//         </button>
//       </div>
//       {horoscopeUploaded && (
//         <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
//           <p className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-1.5">
//             <Sparkles className="w-4 h-4" />Auto-extracted Horoscope Details — please verify
//           </p>
//           <div className="grid grid-cols-2 gap-3">
//             <TextInput label="Rasi (Moon Sign)" placeholder="Mesham" />
//             <TextInput label="Nakshatra (Birth Star)" placeholder="Ashwini" />
//             <SelectInput label="Dosham" options={["None", "Chevvai Dosham", "Rahu Dosham", "Kethu Dosham", "Partial Dosham"]} />
//             <TextInput label="Birth Time" type="time" />
//           </div>
//           <div className="mt-3">
//             <TextInput label="Birth Place" placeholder="Chennai, Tamil Nadu" />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// function RegisterStep5({ setPage }: { setPage: (p: Page) => void }) {
//   return (
//     <div className="space-y-4">
//       <div className="mb-3">
//         <h2 className="font-display text-xl font-bold text-gray-900">Confirm Your Profile</h2>
//         <p className="text-sm text-gray-500">Review details before completing registration</p>
//       </div>
//       <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl border border-rose-100">
//         <img src="https://i.pravatar.cc/80?img=12" alt="Profile" className="w-16 h-16 rounded-xl object-cover ring-2 ring-rose-200 flex-shrink-0" />
//         <div className="min-w-0">
//           <p className="font-display font-bold text-gray-900 text-lg">Arun Kumar</p>
//           <p className="text-sm text-gray-600">28 yrs · Hindu Brahmin · Chennai, Tamil Nadu</p>
//           <p className="text-sm text-gray-600">Software Engineer · 12 LPA</p>
//           <div className="flex gap-1.5 mt-1.5 flex-wrap">
//             <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Mesham</span>
//             <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full font-medium">Ashwini</span>
//             <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">No Dosham</span>
//           </div>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 gap-2">
//         {[["Full Name","Arun Kumar"],["Age","28 years"],["Religion","Hindu (Brahmin)"],["Education","B.Tech"],["Occupation","Software Engineer"],["Annual Income","12 LPA"],["Marital Status","Never Married"],["Location","Chennai, TN"],["WhatsApp","+91 98765 43210 ✓"],["Horoscope","Uploaded & Verified ✓"]].map(([k,v]) => (
//           <div key={k} className="p-3 bg-gray-50 rounded-xl">
//             <p className="text-xs text-gray-400">{k}</p>
//             <p className="text-sm font-medium text-gray-800 mt-0.5">{v}</p>
//           </div>
//         ))}
//       </div>
//       <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
//         <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
//         <p className="text-xs text-amber-700 leading-relaxed">By completing registration you agree to our Terms of Service and Privacy Policy. Your profile will be reviewed and verified within 24 hours.</p>
//       </div>
//     </div>
//   );
// }

function RegisterPage({ step, setStep, setPage }: { step: number; setStep: (s: number) => void; setPage: (p: Page) => void }) {
  const [otpCode, setOtpCode] = useState("4495");
  const [regPhone, setRegPhone] = useState("");
  const [regGender, setRegGender] = useState("female");
  const [ocrText, setOcrText] = useState("");
  const [ocrFields, setOcrFields] = useState<Record<string,string>>({});
  const [horoscopeFile, setHoroscopeFile] = useState<File | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 py-10 px-4">
      <div className={step === 3 ? "max-w-4xl mx-auto" : "max-w-lg mx-auto"}>
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-xl text-[#e11d48]">VivahShaadi</span>
          </div>
          <p className="text-gray-500 text-sm">Create your free profile in minutes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-rose-100">
          {step === 1 && (
            <RegisterStep1
              onNext={(ph, gn) => { setRegPhone(ph); setRegGender(gn); setStep(2); }}
              setPage={setPage}
              onOtpSent={(code) => setOtpCode(code)}
            />
          )}
          {step === 2 && (
            <RegisterStep2
              onNextWithData={(ocr, fields, file) => {
                setOcrText(ocr);
                setOcrFields(fields);
                setHoroscopeFile(file);
                setStep(3);
              }}
              onBack={() => setStep(1)}
              setPage={setPage}
            />
          )}
          {step === 3 && (
            <RegisterFormDetails
              ocrText={ocrText}
              ocrFields={ocrFields}
              horoscopeFile={horoscopeFile}
              phone={regPhone}
              gender={regGender}
              onBack={() => setStep(2)}
              onComplete={() => setPage("dashboard")}
              setPage={setPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LoginPage({ setPage }: { setPage: (p: Page) => void }) {
  const [phone, setPhone] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpCode, setOtpCode] = useState("0932");
  const [notification, setNotification] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setSendingOtp(true);
    try {
      const response = await fetch("https://matrimony-website-otp-backend.onrender.com/api/otp/send", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      if (data.success) {
        setOtpCode(data.code || '----');
        setOtpSent(true);
        setNotification(true);
      } else {
        alert(data.message || 'Failed to send OTP');
      }
    } catch (err) {
      alert('Cannot connect to backend. Make sure the server is running on port 5000.');
    } finally {
      setSendingOtp(false);
    }
  };

const handleResend = async () => {
  setResending(true);

  try {
    const response = await fetch(
      "https://matrimony-website-otp-backend.onrender.com/api/otp/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setOtpCode(data.code || "----");
      setNotification(true);
    } else {
      alert(data.message || "Failed to resend OTP");
    }
  } catch (err) {
    console.error("Resend OTP Error:", err);
    alert("Unable to resend OTP");
  } finally {
    setResending(false);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 py-16 px-4">
      {/* WhatsApp notification toast */}
      {notification && (
        <div
          className="fixed top-4 right-4 z-50 max-w-xs bg-gray-900 text-white rounded-2xl shadow-2xl p-4"
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
              <p className="text-xs text-gray-300 mt-0.5">Your login OTP code is: {otpCode}</p>
              <button
                onClick={() => {
                  setOtp([...otpCode]);
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

      <div className="max-w-xl mx-auto">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="font-display font-bold text-2xl text-[#e11d48]">VivahShaadi</span>
          </div>
          <p className="text-slate-500">Login via WhatsApp OTP</p>
        </div>

        <div className="bg-white rounded-[1.5rem] shadow-sm p-8 border border-gray-100 space-y-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-800">Login</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your WhatsApp number to receive an OTP.
            </p>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">WhatsApp Number</label>
            <div className="flex gap-2 items-center">
              <div className={`flex items-center px-4 py-3.5 border border-gray-200 rounded-[2rem] bg-gray-50/50 text-sm font-semibold text-slate-700 flex-shrink-0 ${otpSent ? "opacity-60" : ""}`}>
                <span className="text-xs mr-1 text-gray-500">IN</span> +91
              </div>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className={`flex-1 px-4 py-3.5 border border-gray-200 rounded-[2rem] bg-gray-50/50 text-sm text-slate-800 focus:outline-none focus:border-[#e11d48] focus:bg-white transition-all min-w-0 placeholder:text-gray-400 ${otpSent ? "opacity-60 cursor-not-allowed" : ""}`}
                disabled={sendingOtp || otpSent}
              />
              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || phone.length !== 10}
                  className={`px-6 py-3.5 text-white font-semibold rounded-[2rem] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap ${
                    sendingOtp || phone.length !== 10
                      ? "bg-rose-400 cursor-not-allowed opacity-70"
                      : "bg-[#e11d48] hover:bg-rose-700 hover:shadow-md"
                  }`}
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              )}
            </div>
          </div>

          {otpSent && (
            <div className="p-6 bg-[#ebfbf3] border border-[#a7f3d0] rounded-[1.5rem] space-y-6">
              <p className="text-sm font-medium text-[#047857] flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                OTP sent to your WhatsApp. Enter below:
              </p>
              <div className="flex gap-4 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    value={digit}
                    id={`login-otp-${i}`}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const n = [...otp]; n[i] = val; setOtp(n);
                      if (val && i < 3) document.getElementById(`login-otp-${i + 1}`)?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otp[i] && i > 0)
                        document.getElementById(`login-otp-${i - 1}`)?.focus();
                    }}
                    className="w-14 h-14 text-center border-2 border-[#a7f3d0] rounded-2xl text-xl font-bold focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 bg-white text-slate-800"
                  />
                ))}
              </div>

              <button
                onClick={() => setPage("dashboard")}
                disabled={!otp.every((d) => d !== "")}
                className={`w-full py-4 text-white font-semibold rounded-[2rem] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  otp.every((d) => d !== "")
                    ? "bg-[#059669] hover:bg-[#047857] hover:shadow-md"
                    : "bg-[#6ee7b7] cursor-not-allowed text-white/80"
                }`}
              >
                <span>Verify & Login</span>
              </button>

              <div className="text-center pt-2">
                <button
                  onClick={() => { setOtpSent(false); setOtp(["", "", "", ""]); }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
                >
                  Change WhatsApp Number
                </button>
              </div>
            </div>
          )}

          <div className="pt-6 mt-4 border-t border-gray-100 text-center space-y-4">
            <p className="text-sm text-gray-500">
              New to VivahShaadi?{" "}
              <button
                onClick={() => setPage("register")}
                className="font-semibold text-[#e11d48] hover:text-rose-700 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                Register Free
              </button>
            </p>
            <button 
              onClick={() => setPage("landing")}
              className="text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1 mx-auto bg-transparent border-none cursor-pointer"
            >
              &#8592; Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Dashboard ────────────────────────────────────────────────────────────────

function ProfileCard({ profile: p, setPage }: { profile: typeof PROFILES[0]; setPage: (pg: Page) => void }) {
  const [interested, setInterested] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden hover:shadow-md hover:border-rose-200 transition-all duration-300 group">
      <div className="relative h-56 bg-rose-50">
        <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
          {p.premium && <PremiumBadge />}
          <MatchBadge pct={p.match} />
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${p.online ? "bg-emerald-400" : "bg-gray-400"}`} />
          <span className="text-white text-xs">{p.online ? "Online" : "Offline"}</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-display font-bold text-white text-lg leading-tight">{p.name}</h3>
          <p className="text-white/75 text-sm">{p.age} yrs · {p.city}, {p.state}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-y-1.5 mb-3">
          {([
            [BookOpen, p.education], [CreditCard, p.salary], [User, p.caste], [MapPin, p.city]
          ] as [typeof BookOpen, string][]).map(([Icon, val], i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
              <Icon className="w-3 h-3 text-rose-400 flex-shrink-0" /><span className="truncate">{val}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5 mb-3 flex-wrap">
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded-full font-medium">{p.rasi}</span>
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs rounded-full font-medium">{p.nakshatra}</span>
          {p.dosham !== "None" && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-xs rounded-full font-medium">{p.dosham}</span>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPage("profile")} className="flex-1 py-2 text-sm font-semibold text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />View
          </button>
          <button onClick={() => setInterested(!interested)} className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${interested ? "bg-emerald-600 text-white" : "bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90"}`}>
            <Heart className={`w-3.5 h-3.5 ${interested ? "fill-white" : ""}`} />{interested ? "Sent!" : "Interest"}
          </button>
          <button onClick={() => setShortlisted(!shortlisted)} className={`p-2 rounded-xl border transition-colors ${shortlisted ? "border-amber-400 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600"}`}>
            <Star className={`w-4 h-4 ${shortlisted ? "fill-amber-400" : ""}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage({ setPage, currentUser }: { setPage: (p: Page) => void; currentUser: any }) {
  const [activeTab, setActiveTab] = useState('recommended');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitAlert, setLimitAlert] = useState('');
  const [filters, setFilters] = useState({ religion: 'All', caste: 'All', state: 'All' });

  const tabs = [['recommended','Recommended'],['nearby','Nearby'],['new','New Profiles'],['horoscope','Horoscope Match']];

  const userId = currentUser?.id;

  const fetchProfiles = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ userId: String(userId) });
      if (filters.religion !== 'All') params.set('religion', filters.religion);
      if (filters.caste !== 'All') params.set('caste', filters.caste);
      if (filters.state !== 'All') params.set('state', filters.state);
      const res = await fetch(`https://matrimony-website-pl27.onrender.com/api/profiles?${params}`);
      const data = await res.json();
      if (data.success) setProfiles(data.profiles);
    } catch (err) {
      console.error('Failed to load profiles', err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSendInterest = async (receiverId: number) => {
    if (!userId) return;
    const res = await fetch('/api/interests/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: userId, receiverId })
    });
    const data = await res.json();
    if (data.limitReached) {
      setLimitAlert(data.message);
    } else if (data.success) {
      alert('Interest sent! 💖');
    } else {
      alert(data.message || 'Failed to send interest');
    }
  };

  useEffect(() => { fetchProfiles(); },[] );
  return (
    <div className="min-h-screen bg-rose-50/40">
      <div className="bg-gradient-to-r from-rose-600 to-purple-700 text-white py-2.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-200 flex-shrink-0" />
            <p className="text-sm font-medium">Profile 65% complete — Add more details to get better matches!</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-20 h-1.5 bg-white/25 rounded-full"><div className="w-[65%] h-full bg-white rounded-full" /></div>
            <button className="text-xs font-semibold hover:text-rose-200 transition-colors">Complete →</button>
          </div>
        </div>
      </div>

      {limitAlert && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 text-lg mb-2">Limit Reached</h3>
            <p className="text-gray-600 text-sm mb-4">{limitAlert}</p>
            <div className="flex gap-3">
              <button onClick={() => setLimitAlert('')} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">Close</button>
              <button onClick={() => { setLimitAlert(''); setPage('premium'); }} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-semibold">Upgrade Now</button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-60 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Filter className="w-4 h-4 text-rose-600" />Filters</h3>
                <button className="text-xs text-rose-600 font-medium hover:text-rose-800 transition-colors">Reset All</button>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-2">Age Range: 22–32 yrs</label>
                <input type="range" min={18} max={50} defaultValue={32} className="w-full accent-rose-600" />
              </div>
              {[
                { label: "Religion", opts: ["Hindu","Muslim","Christian","Sikh"] },
                { label: "Caste", opts: ["Brahmin","Iyer","Mudaliar","Pillai","Nadar","Nair"] },
                { label: "Education", opts: ["B.E./B.Tech","MBBS","MBA","M.Tech","CA","PhD"] },
                { label: "Annual Income", opts: ["3–5 LPA","5–8 LPA","8–12 LPA","12–20 LPA","20+ LPA"] },
                { label: "Location", opts: ["Tamil Nadu","Karnataka","Andhra Pradesh","Maharashtra","Kerala"] },
                { label: "Match Score", opts: ["90%+","80%+","70%+","All Matches"] },
              ].map(({ label, opts }) => (
                <div key={label} className="mb-4">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">{label}</label>
                  <select className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-rose-400 transition-colors">
                    <option>All</option>
                    {opts.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <button className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-purple-700 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-sm">Apply Filters</button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-gray-900">Matches for You</h1>
                <p className="text-sm text-gray-500">{loading ? 'Loading profiles...' : `${profiles.length} profiles based on your preferences`}</p>
              </div>
              <select className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:border-rose-400 shadow-sm">
                <option>Sort: Horoscope Match</option>
                <option>Sort: Newest First</option>
                <option>Sort: Age (Low to High)</option>
              </select>
            </div>
            <div className="flex gap-1 mb-5 bg-white rounded-xl p-1 shadow-sm border border-rose-100 overflow-x-auto">
              {tabs.map(([id, label]) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === id ? "bg-gradient-to-r from-rose-600 to-purple-700 text-white shadow-sm" : "text-gray-600 hover:text-rose-700 hover:bg-rose-50"}`}>{label}</button>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {loading ? (
                <div className="col-span-full text-center py-16">
                  <div className="animate-spin w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Finding matches for you...</p>
                </div>
              ) : profiles.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
                  <p className="text-gray-500">No profiles found. Try adjusting your filters.</p>
                </div>
              ) : profiles.map(p => (
                <LiveProfileCard
                  key={p.id}
                  profile={p}
                  currentUser={currentUser}
                  setPage={setPage}
                  onSendInterest={handleSendInterest}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Live Profile Card (from MySQL) ──────────────────────────────────────────

function LiveProfileCard({ profile: p, currentUser, setPage, onSendInterest }: { profile: any; currentUser: any; setPage: (pg: Page) => void; onSendInterest: (id: number) => void }) {
  const [interested, setInterested] = useState(false);
  const plan = currentUser?.premium_plan || 'Basic';
  const isLocked = plan === 'Basic';

  // Rough match % based on shared fields
  const matchPct = Math.min(99, Math.max(60,
    (p.religion === currentUser?.religion ? 10 : 0) +
    (p.caste === currentUser?.caste ? 15 : 0) +
    (p.state === currentUser?.state ? 10 : 0) +
    (p.nakshatra ? 5 : 0) +
    (p.dosham === 'None' ? 5 : 0) +
    60
  ));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="relative">
        <img src={p.img || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300'} alt={p.name} className="w-full h-52 object-cover" />
        {p.premium_plan !== 'Basic' && <div className="absolute top-3 left-3"><PremiumBadge /></div>}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
          <span className={`w-1.5 h-1.5 rounded-full ${p.online ? 'bg-emerald-400' : 'bg-gray-400'}`} />
          <span className="text-white text-xs">{p.online ? 'Online' : 'Offline'}</span>
        </div>
        {isLocked && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/90 rounded-lg">
              <Lock className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-semibold">Upgrade to unlock full profile</span>
            </div>
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-gray-900">{p.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{p.age} yrs · {p.city}, {p.state}</p>
          </div>
          <MatchBadge pct={matchPct} />
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.education && <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">{p.education}</span>}
          {p.job && <span className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">{p.job}</span>}
          {p.rasi && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full">{p.rasi}</span>}
        </div>
        {!isLocked && p.phone && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-1.5">
            <Phone className="w-3.5 h-3.5" /> +91 {p.phone}
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={() => setPage('profile')} className="flex-1 py-2 text-sm font-semibold text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />View
          </button>
          <button
            onClick={() => { setInterested(true); onSendInterest(p.id); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              interested ? 'bg-emerald-600 text-white' : 'bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${interested ? 'fill-white' : ''}`} />
            {interested ? 'Sent!' : 'Interest'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile View ─────────────────────────────────────────────────────────────

function ProfilePage({ setPage }: { setPage: (p: Page) => void }) {
  const p = PROFILES[0];
  const [tab, setTab] = useState("basic");
  const [interested, setInterested] = useState(false);
  const [shortlisted, setShortlisted] = useState(false);

  return (
    <div className="min-h-screen bg-rose-50/40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => setPage("dashboard")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-rose-700 mb-5 group transition-colors">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />Back to matches
        </button>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-rose-100">
              <div className="relative aspect-square bg-rose-50">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                {p.premium && <div className="absolute top-3 left-3"><PremiumBadge /></div>}
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-black/40 backdrop-blur-sm rounded-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.online ? "bg-emerald-400" : "bg-gray-400"}`} />
                  <span className="text-white text-xs">{p.online ? "Online Now" : "Last seen 2h ago"}</span>
                </div>
              </div>
              <div className="p-3 grid grid-cols-4 gap-1.5">
                {[47,57,58,63].map((n, i) => (
                  <div key={i} className={`aspect-square rounded-lg overflow-hidden cursor-pointer ring-2 transition-all ${i === 0 ? "ring-rose-500" : "ring-transparent hover:ring-rose-300"}`}>
                    <img src={`https://i.pravatar.cc/80?img=${n}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900 to-rose-900 rounded-2xl p-5 text-center text-white">
              <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-white/65 text-xs uppercase tracking-wide mb-1">Horoscope Compatibility</p>
              <p className="font-display text-4xl font-bold text-amber-400 leading-none">{p.match}%</p>
              <p className="text-white/75 text-sm mt-2">Excellent Match</p>
              <div className="mt-3 flex justify-center gap-1.5 flex-wrap">
                {["Rasi ✓","Nakshatra ✓","No Dosham ✓"].map(t => (
                  <span key={t} className="px-2 py-0.5 bg-white/10 text-white/75 text-xs rounded-full">{t}</span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 space-y-2.5">
              <button onClick={() => setInterested(!interested)} className={`w-full py-3 font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${interested ? "bg-emerald-600 text-white" : "bg-gradient-to-r from-rose-600 to-purple-700 text-white hover:opacity-90 shadow-sm"}`}>
                <Heart className={`w-4 h-4 ${interested ? "fill-white" : ""}`} />{interested ? "Interest Sent!" : "Send Interest"}
              </button>
              <button onClick={() => setPage("chat")} className="w-full py-3 border border-rose-300 text-rose-700 font-semibold rounded-xl hover:bg-rose-50 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />Send Message
              </button>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Shortlist", icon: Star, onClick: () => setShortlisted(!shortlisted), active: shortlisted, color: "amber" },
                  { label: "Report", icon: Flag, onClick: () => {}, active: false, color: "gray" },
                  { label: "Block", icon: Ban, onClick: () => {}, active: false, color: "gray" },
                ].map(({ label, icon: Icon, onClick, active, color }) => (
                  <button key={label} onClick={onClick} className={`py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors ${active ? "border-amber-300 bg-amber-50 text-amber-600" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
                    <Icon className="w-3.5 h-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5">
              <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h1 className="font-display text-2xl font-bold text-gray-900">{p.name}</h1>
                  <p className="text-gray-500 mt-0.5">{p.age} years · {p.height} · {p.complexion}</p>
                  <p className="text-gray-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-rose-400" />{p.city}, {p.state}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {p.premium && <PremiumBadge />}
                  <MatchBadge pct={p.match} />
                </div>
              </div>

              <div className="flex gap-1 bg-rose-50 rounded-xl p-1 mb-4 overflow-x-auto">
                {["basic","family","horoscope","expectations"].map(t => (
                  <button key={t} onClick={() => setTab(t)} className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${tab === t ? "bg-white shadow-sm text-rose-700" : "text-gray-500 hover:text-rose-700"}`}>{t}</button>
                ))}
              </div>

              {tab === "basic" && (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {[["Full Name",p.name],["Age",`${p.age} years`],["Height",p.height],["Complexion",p.complexion],["Religion",p.religion],["Caste",p.caste],["Education",p.education],["Occupation",p.job],["Annual Income",p.salary],["Marital Status","Never Married"],["Mother Tongue","Tamil"],["Diet","Vegetarian"]].map(([k,v]) => (
                    <div key={k} className="flex gap-3 p-3 bg-rose-50/60 rounded-xl">
                      <p className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{k}</p>
                      <p className="text-sm font-medium text-gray-800">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "family" && (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {[["Father","Retired Govt Officer"],["Mother","Housewife"],["Siblings","1 Brother (Married)"],["Family Type","Nuclear Family"],["Family Status","Middle Class"],["Family Values","Traditional / Orthodox"],["Native Place","Kumbakonam, TN"],["Gothram","Bharadwaja"]].map(([k,v]) => (
                    <div key={k} className="flex gap-3 p-3 bg-rose-50/60 rounded-xl">
                      <p className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{k}</p>
                      <p className="text-sm font-medium text-gray-800">{v}</p>
                    </div>
                  ))}
                </div>
              )}

              {tab === "horoscope" && (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {[["Rasi",p.rasi],["Nakshatra",p.nakshatra],["Dosham",p.dosham],["Birth Time","06:30 AM"],["Birth Place","Chennai, Tamil Nadu"],["Lagnam","Mesham"]].map(([k,v]) => (
                      <div key={k} className="flex gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-400 w-24 flex-shrink-0 pt-0.5">{k}</p>
                        <p className="text-sm font-semibold text-purple-900">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-rose-50 rounded-xl border border-purple-100 text-center">
                    <p className="text-sm text-gray-500 mb-1">Your compatibility with this profile</p>
                    <p className="font-display text-3xl font-bold text-purple-700">{p.match}%</p>
                    <p className="text-xs text-gray-400 mt-1">Based on Rasi, Nakshatra & Dosham matching</p>
                  </div>
                </div>
              )}

              {tab === "expectations" && (
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {[["Age Preference","25–32 years"],["Height Preference","5'5\" and above"],["Religion","Hindu (Brahmin preferred)"],["Education","Graduate and above"],["Income","8 LPA and above"],["Occupation","Professional / Business"],["Location","Tamil Nadu / Bangalore"],["Dosham","None preferred"]].map(([k,v]) => (
                    <div key={k} className="flex gap-3 p-3 bg-rose-50/60 rounded-xl">
                      <p className="text-xs text-gray-400 w-28 flex-shrink-0 pt-0.5">{k}</p>
                      <p className="text-sm font-medium text-gray-800">{v}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Interests ────────────────────────────────────────────────────────────────

function InterestsPage({ setPage, currentUser }: { setPage: (p: Page) => void; currentUser: any }) {
  const [tab, setTab] = useState('received');
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = currentUser?.id;

  const fetchInterests = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/interests?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setReceived(data.received || []);
        setSent(data.sent || []);
      }
    } catch (err) {
      console.error('Failed to load interests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (interestId: number, status: string) => {
    try {
      const res = await fetch('/api/interests/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interestId, status })
      });
      const data = await res.json();
      if (data.success) fetchInterests();
    } catch (err) {
      console.error('Failed to respond', err);
    }
  };

  useEffect(() => { fetchInterests(); }, []);

  const receivedPending = received.filter(i => i.status === 'pending');
  const receivedAccepted = received.filter(i => i.status === 'accepted');
  const sentList = sent;

  const tabs = [['received', 'Received', receivedPending.length], ['sent', 'Sent', sentList.length], ['accepted', 'Accepted', receivedAccepted.length], ['rejected', 'Declined', 0]];

  const filtered = tab === 'received' ? receivedPending
    : tab === 'sent' ? sentList
    : tab === 'accepted' ? receivedAccepted
    : received.filter(i => i.status === 'rejected');

  return (
    <div className="min-h-screen bg-rose-50/40">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Interest Requests</h1>
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm border border-rose-100 mb-6">
          {tabs.map(([id, label, count]) => (
            <button key={id as string} onClick={() => setTab(id as string)} className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${tab === id ? 'bg-gradient-to-r from-rose-600 to-purple-700 text-white shadow-sm' : 'text-gray-600 hover:text-rose-700 hover:bg-rose-50'}`}>
              {label}
              {(count as number) > 0 && <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${tab === id ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>{count}</span>}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="text-center py-16"><div className="animate-spin w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full mx-auto" /></div>
        ) : (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Heart className="w-10 h-10 mx-auto mb-2 text-rose-200" />
              <p className="text-sm">No interests in this category yet.</p>
            </div>
          )}
          {filtered.map((interest: any) => (
            <div key={interest.id} className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <img src={interest.img || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'} alt={interest.name} className="w-14 h-14 rounded-xl object-cover" />
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${interest.status === 'accepted' ? 'bg-emerald-500' : interest.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{interest.name}</p>
                <p className="text-sm text-gray-500">{interest.age} yrs · {interest.city}</p>
                <p className="text-xs text-gray-400 mt-0.5">{new Date(interest.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col gap-2 flex-shrink-0">
                {interest.status === 'pending' && tab === 'received' && (
                  <>
                    <button onClick={() => handleRespond(interest.id, 'accepted')} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1"><Check className="w-3 h-3" />Accept</button>
                    <button onClick={() => handleRespond(interest.id, 'rejected')} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"><X className="w-3 h-3" />Decline</button>
                  </>
                )}
                {interest.status === 'accepted' && (
                  <button onClick={() => setPage('chat')} className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-1"><MessageCircle className="w-3 h-3" />Chat</button>
                )}
                {interest.status === 'rejected' && (
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-400 text-xs font-semibold rounded-lg">Declined</span>
                )}
                {tab === 'sent' && interest.status === 'pending' && (
                  <span className="px-3 py-1.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-lg border border-amber-200">Pending</span>
                )}
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

function ChatPage({ setPage, currentUser }: { setPage: (p: Page) => void; currentUser: any }) {
  const [activeChat, setActiveChat] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const userId = currentUser?.id;

  const fetchChats = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/chats?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setChats(data.chats || []);
        if (data.chats?.length > 0 && !activeChat) setActiveChat(data.chats[0]);
      }
    } catch (err) { console.error(err); }
  };

  const fetchHistory = async (receiverId: number) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/chats/${receiverId}?userId=${userId}`);
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (err) { console.error(err); }
  };

  const sendMsg = async () => {
    if (!message.trim() || !activeChat || !userId) return;
    try {
await fetch('/api/chats/send', {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: userId, receiverId: activeChat.id, text: message })
      });
      setMessages(prev => [...prev, { id: Date.now(), sender_id: userId, text: message, created_at: new Date().toISOString() }]);
      setMessage('');
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchChats(); }, []);

  const onSelectChat = (chat: any) => {
    setActiveChat(chat);
    fetchHistory(chat.id);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden">
      {/* Chat List */}
      <div className="w-72 flex-shrink-0 border-r border-rose-100 flex flex-col">
        <div className="p-4 border-b border-rose-100">
          <h2 className="font-display font-bold text-gray-900 mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 transition-colors" placeholder="Search chats..." />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <MessageCircle className="w-10 h-10 mx-auto mb-2 text-rose-200" />
              <p className="text-sm">No chats yet. Accept interests to start chatting!</p>
            </div>
          )}
          {chats.map((chat: any) => (
            <button key={chat.id} onClick={() => onSelectChat(chat)} className={`w-full flex items-center gap-3 p-4 hover:bg-rose-50 transition-colors border-b border-rose-50/50 ${activeChat?.id === chat.id ? 'bg-rose-50' : ''}`}>
              <div className="relative flex-shrink-0">
                <img src={chat.img || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'} alt={chat.name} className="w-11 h-11 rounded-xl object-cover" />
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${chat.online ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm text-gray-900">{chat.name}</p>
                  <p className="text-xs text-gray-400">{chat.time ? new Date(chat.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                </div>
                <p className="text-xs text-gray-500 truncate mt-0.5">{chat.lastMsg || 'No messages yet'}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Chat Window */}
      {activeChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-rose-100 bg-white">
            <img src={activeChat.img || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100'} alt={activeChat.name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <p className="font-semibold text-gray-900">{activeChat.name}</p>
              <p className="text-xs text-gray-400">{activeChat.online ? 'Online Now' : 'Last seen recently'}</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-rose-50/30">
            {messages.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2.5 rounded-2xl text-sm ${msg.sender_id === userId ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm border border-rose-100'}`}>
                  {msg.text}
                  <p className={`text-[10px] mt-1 ${msg.sender_id === userId ? 'text-white/60' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-4 border-t border-rose-100 bg-white">
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-400 hover:text-rose-600 transition-colors"><Paperclip className="w-5 h-5" /></button>
              <input
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMsg()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 transition-colors"
              />
              <button onClick={sendMsg} className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 flex items-center justify-center hover:opacity-90 transition-opacity">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 mx-auto mb-3 text-rose-200" />
            <p>Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── Premium ──────────────────────────────────────────────────────────────────

function PremiumPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
            <Crown className="w-4 h-4" />Premium Membership
          </div>
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-3">
            Find Your Match <span className="text-rose-700">Faster</span>
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">Join 50,000+ premium members who found their life partner with our exclusive features.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {PLANS.map((plan, i) => (
            <div key={i} className={`relative rounded-2xl p-6 border-2 ${plan.popular ? "border-amber-400 shadow-xl shadow-amber-100 bg-gradient-to-b from-white to-amber-50" : "border-rose-100 bg-white hover:border-rose-300 hover:shadow-md transition-all"}`}>
              {plan.popular && (
                <div className="absolute -top-3 inset-x-0 flex justify-center">
                  <span className="px-4 py-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white text-xs font-bold rounded-full shadow">✨ Most Popular</span>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                {i === 0 ? <Shield className="w-5 h-5 text-gray-400" /> : i === 1 ? <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> : <Crown className="w-5 h-5 text-purple-600" />}
                <h3 className="font-display text-xl font-bold text-gray-900">{plan.name}</h3>
              </div>
              <div className="flex items-end gap-1 mb-5">
                <span className="font-display text-4xl font-bold text-rose-700">{plan.price}</span>
                <span className="text-gray-400 text-sm pb-1">{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check className="w-2.5 h-2.5 text-emerald-600" /></div>
                    {f}
                  </li>
                ))}
                {plan.extras.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm text-gray-400">
                    <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><X className="w-2.5 h-2.5 text-gray-300" /></div>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:opacity-90 shadow-md shadow-amber-200" : i === 2 ? "bg-gradient-to-r from-purple-600 to-rose-600 text-white hover:opacity-90 shadow-sm" : "border-2 border-rose-300 text-rose-700 hover:bg-rose-50"}`}>
                {i === 0 ? "Start Free" : `Get ${plan.name} Plan`}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-rose-100">
            <h2 className="font-display text-xl font-bold text-gray-900">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-rose-50/60">
                  <th className="px-6 py-3.5 text-left text-sm font-semibold text-gray-600">Feature</th>
                  {PLANS.map(p => <th key={p.name} className={`px-6 py-3.5 text-center text-sm font-semibold ${p.popular ? "text-amber-700" : "text-gray-600"}`}>{p.name}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-50">
                {[
                  ["Profile Views","50/month","Unlimited","Unlimited"],
                  ["Interest Requests","10/month","50/month","Unlimited"],
                  ["WhatsApp Number Unlock","✗","✓","✓"],
                  ["Horoscope Matching","✗","✓","✓"],
                  ["Chat & Voice Notes","✗","✓","✓"],
                  ["Priority Listing","✗","✗","✓"],
                  ["Dedicated Relationship Manager","✗","✗","✓"],
                  ["Video Calling","✗","✗","✓"],
                ].map(([feature, ...vals], i) => (
                  <tr key={i} className="hover:bg-rose-50/40 transition-colors">
                    <td className="px-6 py-3.5 text-sm text-gray-700 font-medium">{feature}</td>
                    {vals.map((v, j) => (
                      <td key={j} className="px-6 py-3.5 text-center">
                        {v === "✓" ? <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto" /> :
                         v === "✗" ? <X className="w-4 h-4 text-gray-300 mx-auto" /> :
                         <span className="text-sm font-medium text-gray-700">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, change, bg }: { label: string; value: string; icon: React.ElementType; change: string; bg: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className={`flex items-center gap-0.5 text-xs font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          <TrendingUp className="w-3 h-3" />{change}
        </span>
      </div>
      <p className="text-2xl font-bold text-white font-display">{value}</p>
      <p className="text-gray-400 text-sm mt-0.5">{label}</p>
    </div>
  );
}

function AdminOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Total Users", value: "48,729", icon: Users, change: "+12.3%", bg: "bg-blue-600" },
          { label: "Male Users", value: "22,104", icon: User, change: "+8.1%", bg: "bg-indigo-600" },
          { label: "Female Users", value: "26,625", icon: User, change: "+15.2%", bg: "bg-rose-600" },
          { label: "Active Users", value: "31,450", icon: CheckCircle, change: "+5.7%", bg: "bg-emerald-600" },
          { label: "Pending Verify", value: "843", icon: AlertCircle, change: "-3.4%", bg: "bg-amber-600" },
          { label: "Premium Users", value: "5,219", icon: Crown, change: "+22.1%", bg: "bg-purple-600" },
        ].map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-white">Daily Registrations</h3>
              <p className="text-gray-400 text-xs mt-0.5">New profiles this week</p>
            </div>
            <select className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none">
              <option>This Week</option><option>This Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REG_DATA}>
              <defs>
                <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#BE185D" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#BE185D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#F9FAFB", fontSize: "12px" }} />
              <Area type="monotone" dataKey="users" stroke="#BE185D" strokeWidth={2} fill="url(#regGrad)" dot={{ fill: "#BE185D", strokeWidth: 0, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-5">Gender Split</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={GENDER_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                {GENDER_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#F9FAFB", fontSize: "12px" }} formatter={(v: number) => [v.toLocaleString(), ""]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2.5 mt-2">
            {GENDER_DATA.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-xs text-gray-400">{d.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-300">{(d.value / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-white">Revenue Analytics</h3>
            <p className="text-gray-400 text-xs mt-0.5">Monthly revenue (₹ in lakhs)</p>
          </div>
          <div className="text-right">
            <p className="text-white font-bold text-lg font-display">₹23.4L</p>
            <p className="text-emerald-400 text-xs">+16.4% vs last month</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={REVENUE_DATA} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
            <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
            <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: "8px", color: "#F9FAFB", fontSize: "12px" }} formatter={(v: number) => [`₹${v}L`, "Revenue"]} />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {REVENUE_DATA.map((_, i) => <Cell key={i} fill={i === REVENUE_DATA.length - 1 ? "#BE185D" : "#7C3AED"} fillOpacity={i === REVENUE_DATA.length - 1 ? 1 : 0.7} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function AdminUsers() {
  const [search, setSearch] = useState("");
  const filtered = USERS_TABLE.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.city.toLowerCase().includes(search.toLowerCase())
  );
  const statusStyle = (s: string) =>
    s === "Active" ? "text-emerald-400 bg-emerald-400/10" :
    s === "Pending" ? "text-amber-400 bg-amber-400/10" :
    "text-red-400 bg-red-400/10";

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or city..." className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-rose-500 transition-colors" />
        </div>
        {["All", "Active", "Pending", "Blocked"].map(f => (
          <button key={f} className="px-4 py-2.5 text-sm border border-gray-700 text-gray-400 rounded-xl hover:border-rose-500 hover:text-rose-400 transition-colors">{f}</button>
        ))}
        <button className="px-4 py-2.5 text-sm bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-1.5 ml-auto">
          <Upload className="w-4 h-4" />Export
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["User","Gender","Phone","City","Status","Plan","Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={`https://i.pravatar.cc/40?u=${user.id}`} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-white truncate">{user.name}</p>
                          {user.verified && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500">{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${user.gender === "Male" ? "bg-blue-400/10 text-blue-400" : "bg-rose-400/10 text-rose-400"}`}>{user.gender}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-400 font-mono text-xs">{user.phone}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{user.city}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle(user.status)}`}>{user.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    {user.premium ? <PremiumBadge /> : <span className="text-xs text-gray-600">Free</span>}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1">
                      {[
                        [Eye, "hover:text-blue-400 hover:bg-blue-400/10"],
                        [Edit2, "hover:text-amber-400 hover:bg-amber-400/10"],
                        [Ban, "hover:text-orange-400 hover:bg-orange-400/10"],
                        [Trash2, "hover:text-red-400 hover:bg-red-400/10"],
                      ].map(([Icon, cls], i) => (
                        <button key={i} className={`p-1.5 text-gray-600 rounded-lg transition-colors ${cls}`}>
                          {/* @ts-ignore */}
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between">
          <p className="text-xs text-gray-500">Showing {filtered.length} of {USERS_TABLE.length} users</p>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <button key={n} className={`w-7 h-7 text-xs rounded-lg transition-colors ${n === 1 ? "bg-rose-600 text-white" : "text-gray-500 hover:bg-gray-800"}`}>{n}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminHoroscope() {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[
        { name: "Priya Sharma", id: "U047", time: "2h ago", status: "pending" },
        { name: "Kavitha Reddy", id: "U103", time: "5h ago", status: "pending" },
        { name: "Ananya Krishnan", id: "U089", time: "1 day ago", status: "approved" },
      ].map((item, i) => (
        <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-white">{item.name}</p>
              <p className="text-xs text-gray-500">{item.id} · {item.time}</p>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${item.status === "pending" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400"}`}>{item.status}</span>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 mb-4 min-h-20 flex items-center justify-center">
            <div className="text-center text-gray-600">
              <ImgIcon className="w-7 h-7 mx-auto mb-1" />
              <p className="text-xs">jathagam_{item.id}.pdf</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[["Rasi","Mesham"],["Nakshatra","Ashwini"],["Dosham","None"],["Birth Time","06:30 AM"]].map(([k,v]) => (
              <div key={k} className="bg-gray-800 rounded-lg p-2.5">
                <p className="text-xs text-gray-500 mb-0.5">{k}</p>
                <p className="text-sm text-white font-medium">{v}</p>
              </div>
            ))}
          </div>
          {item.status === "pending" ? (
            <div className="flex gap-2">
              <button className="flex-1 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5" />Approve</button>
              <button className="flex-1 py-2 border border-red-500/30 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5" />Reject</button>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 bg-emerald-400/10 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Approved & Verified</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AdminReports() {
  const reports = [
    { user: "Rajesh K.", reporter: "Priya M.", type: "Fake Profile", severity: "High", time: "1h ago", status: "open" },
    { user: "Anon User", reporter: "Kavitha R.", type: "Harassment", severity: "High", time: "3h ago", status: "open" },
    { user: "Suresh V.", reporter: "Meena I.", type: "Suspicious Activity", severity: "Medium", time: "1 day ago", status: "investigating" },
    { user: "Ram Kumar", reporter: "Ananya K.", type: "Spam Messages", severity: "Low", time: "2 days ago", status: "resolved" },
  ];
  const sevCls = (s: string) => s === "High" ? "bg-red-400/10 text-red-400" : s === "Medium" ? "bg-amber-400/10 text-amber-400" : "bg-blue-400/10 text-blue-400";
  const stsCls = (s: string) => s === "open" ? "bg-red-400/10 text-red-400" : s === "investigating" ? "bg-amber-400/10 text-amber-400" : "bg-emerald-400/10 text-emerald-400";
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Open Reports", value: "23", icon: AlertCircle, cls: "text-red-400" },
          { label: "Under Investigation", value: "8", icon: Shield, cls: "text-amber-400" },
          { label: "Resolved (30d)", value: "142", icon: CheckCircle, cls: "text-emerald-400" },
        ].map((s, i) => (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center gap-4">
            <s.icon className={`w-9 h-9 ${s.cls}`} />
            <div><p className="text-2xl font-bold text-white font-display">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Recent Reports</h3>
          <select className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none">
            <option>All Types</option><option>Fake Profile</option><option>Harassment</option>
          </select>
        </div>
        <div className="divide-y divide-gray-800/40">
          {reports.map((r, i) => (
            <div key={i} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-800/30 transition-colors">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${r.severity === "High" ? "text-red-400" : r.severity === "Medium" ? "text-amber-400" : "text-blue-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-white">Report against {r.user}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sevCls(r.severity)}`}>{r.severity}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stsCls(r.status)}`}>{r.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{r.type} · By {r.reporter} · {r.time}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button className="p-1.5 text-gray-600 hover:text-blue-400 rounded-lg hover:bg-blue-400/10 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"><Ban className="w-3.5 h-3.5" /></button>
                <button className="p-1.5 text-gray-600 hover:text-emerald-400 rounded-lg hover:bg-emerald-400/10 transition-colors"><CheckCircle className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminSubscriptions() {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { plan: "Basic", users: 8240, revenue: "₹82.4L", cls: "text-gray-400", border: "border-gray-700" },
          { plan: "Gold", users: 3891, revenue: "₹97.3L", cls: "text-amber-400", border: "border-amber-600/30" },
          { plan: "Premium", users: 1328, revenue: "₹66.4L", cls: "text-purple-400", border: "border-purple-600/30" },
        ].map((p, i) => (
          <div key={i} className={`bg-gray-900 border rounded-2xl p-5 ${p.border}`}>
            <p className={`font-display font-bold text-lg ${p.cls}`}>{p.plan}</p>
            <p className="text-3xl font-bold text-white font-display mt-1">{p.users.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Active subscribers</p>
            <p className={`text-sm font-semibold mt-3 ${p.cls}`}>{p.revenue} revenue</p>
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-semibold text-white">Manage Plans</h3>
          <button className="px-4 py-2 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-colors">+ Create Plan</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                {["Plan","Price","Duration","Subscribers","Status","Actions"].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40">
              {PLANS.map((plan, i) => (
                <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-4 text-white font-semibold">{plan.name}</td>
                  <td className="px-5 py-4 text-gray-300">{plan.price}</td>
                  <td className="px-5 py-4 text-gray-300 capitalize">{plan.period.replace("/","").trim()}</td>
                  <td className="px-5 py-4 text-gray-300">{[8240, 3891, 1328][i].toLocaleString()}</td>
                  <td className="px-5 py-4"><span className="text-xs px-2.5 py-1 bg-emerald-400/10 text-emerald-400 rounded-full font-medium">Active</span></td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button className="p-1.5 text-gray-600 hover:text-amber-400 rounded-lg hover:bg-amber-400/10 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminPlaceholder({ section }: { section: string }) {
  const titles: Record<string, string> = { interests: "Interest Management", chat: "Chat Monitoring", cms: "CMS Management", settings: "System Settings" };
  const descriptions: Record<string, string> = {
    interests: "Monitor sent and received interests, approve or reject connections.",
    chat: "Review user conversations and flag abusive messages.",
    cms: "Manage banners, success stories, blog posts, and FAQs.",
    settings: "Configure branding, OTP gateway, payment settings, and notifications.",
  };
  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center bg-gray-900 border border-gray-800 rounded-2xl p-12">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
        <Settings className="w-8 h-8 text-gray-600" />
      </div>
      <h2 className="text-white font-semibold text-xl mb-2">{titles[section]}</h2>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">{descriptions[section]}</p>
    </div>
  );
}

function AdminPanel({ section, setSection, setPage }: { section: AdminSection; setSection: (s: AdminSection) => void; setPage: (p: Page) => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navItems: { id: AdminSection; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "users", label: "User Management", icon: Users },
    { id: "horoscope", label: "Horoscope Verify", icon: Sparkles },
    { id: "interests", label: "Interest Monitor", icon: Heart },
    { id: "chat", label: "Chat Monitor", icon: MessageCircle },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "cms", label: "CMS", icon: BookOpen },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}>
        <div className={`flex items-center gap-3 border-b border-gray-800 p-4 ${sidebarOpen ? "" : "justify-center"}`}>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-purple-700 flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-white fill-white" />
          </div>
          {sidebarOpen && (<span className="font-display font-bold text-white text-sm">Admin Panel</span>)}
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto px-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${section === item.id ? "bg-rose-600/15 text-rose-400" : "text-gray-500 hover:text-white hover:bg-white/5"} ${sidebarOpen ? "" : "justify-center"}`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${section === item.id ? "text-rose-400" : ""}`} />
              {sidebarOpen && <><span className="text-sm font-medium flex-1 text-left">{item.label}</span>{section === item.id && <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />}</>}
            </button>
          ))}
        </nav>
        <div className={`p-3 border-t border-gray-800 space-y-1 ${sidebarOpen ? "" : "flex flex-col items-center"}`}>
          <button onClick={() => setPage("landing")} className={`w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-colors ${sidebarOpen ? "" : "justify-center"}`}>
            <Globe className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">View Website</span>}
          </button>
          <button onClick={() => setPage("landing")} className={`w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-xl transition-colors ${sidebarOpen ? "" : "justify-center"}`}>
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-white font-semibold text-sm">{navItems.find(n => n.id === section)?.label}</h1>
              <p className="text-gray-500 text-xs">VivahShaadi Admin · {new Date().toLocaleDateString("en-IN", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-800">
              <img src="https://i.pravatar.cc/32?img=32" alt="Admin" className="w-8 h-8 rounded-lg object-cover ring-1 ring-rose-600" />
              <div className="hidden sm:block">
                <p className="text-white text-xs font-semibold leading-none">Admin User</p>
                <p className="text-gray-500 text-xs mt-0.5">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-950">
          {section === "overview" && <AdminOverview />}
          {section === "users" && <AdminUsers />}
          {section === "horoscope" && <AdminHoroscope />}
          {section === "reports" && <AdminReports />}
          {section === "subscriptions" && <AdminSubscriptions />}
          {(section === "interests" || section === "chat" || section === "cms" || section === "settings") && <AdminPlaceholder section={section} />}
        </div>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState<Page>('landing');
  const [regStep, setRegStep] = useState(1);
  const [adminSection, setAdminSection] = useState<AdminSection>('overview');
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('vivahUser') || 'null'); } catch { return null; }
  });

  // Sync user from localStorage on any navigation
  const refreshUser = async (userId?: number) => {
    const id = userId || currentUser?.id;
    if (!id) return;
    try {
      const res = await fetch(`/api/user/me?userId=${id}`);
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('vivahUser', JSON.stringify(data.user));
      }
    } catch (err) { console.error(err); }
  };

  const navigate = (p: Page) => {
    setPage(p);
    if (p === 'register') setRegStep(1);
    if (p === 'dashboard') refreshUser();
    window.scrollTo(0, 0);
  };

  const handleLogout = () => {
    localStorage.removeItem('vivahUser');
    setCurrentUser(null);
    navigate('landing');
  };

  if (page === 'admin') {
    return (
      <AdminPanel
        section={adminSection}
        setSection={setAdminSection}
        setPage={navigate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar page={page} setPage={navigate} />

      {/* Floating Plan Simulator */}
      {currentUser && (page === 'dashboard' || page === 'premium') && (
        <PlanSimulator currentUser={currentUser} onPlanChange={(user) => {
          setCurrentUser(user);
          localStorage.setItem('vivahUser', JSON.stringify(user));
        }} />
      )}

      {page === 'landing' && <LandingPage setPage={navigate} />}
      {page === 'login' && <LoginPage setPage={navigate} />}
      {page === 'register' && (
        <RegisterPage step={regStep} setStep={setRegStep} setPage={navigate} />
      )}
      {page === 'dashboard' && <DashboardPage setPage={navigate} currentUser={currentUser} />}
      {page === 'profile' && <ProfilePage setPage={navigate} />}
      {page === 'interests' && <InterestsPage setPage={navigate} currentUser={currentUser} />}
      {page === 'chat' && <ChatPage setPage={navigate} currentUser={currentUser} />}
      {page === 'premium' && <PremiumPage setPage={navigate} />}
    </div>
  );
}
