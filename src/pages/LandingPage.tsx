import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Zap, Video, FileText, Mic2, Download, CheckCircle2, ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onGetAccess: () => void;
}

export default function LandingPage({ onGetAccess }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'ဘယ်လိုအလုပ်လုပ်လဲ', href: '#process' },
    { label: 'အဓိကလုပ်ဆောင်ချက်များ', href: '#features' },
    { label: 'အသံများ', href: '#voices' },
    { label: 'ဈေးနှုန်း', href: '#pricing' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white font-sans selection:bg-[#FACC15]/30 relative overflow-x-hidden selection:text-white">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#FACC15]/5 to-transparent pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FACC15]/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B0B0B]/80 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FACC15] to-yellow-600 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.3)]">
              <Zap size={16} className="text-black fill-current" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">Blink</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.label} href={link.href} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
            <button
              onClick={onGetAccess}
              className="bg-white text-black px-4 py-2 rounded-full font-semibold text-sm hover:scale-105 active:scale-95 transition-all duration-200"
            >
              အခုပဲ စတင်အသုံးပြုမယ်
            </button>
          </div>

          <button
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-[60] bg-[#0B0B0B]/95 backdrop-blur-3xl flex flex-col"
          >
            <div className="px-6 h-16 flex items-center justify-end border-b border-white/10">
              <button
                className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl font-bold text-zinc-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onGetAccess();
                }}
                className="mt-8 bg-white text-black w-full max-w-xs py-4 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                အခုပဲရယူမယ်
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-32 pb-24 px-6 max-w-6xl mx-auto space-y-40 relative z-10">
        {/* 1. Hero Section */}
        <section className="flex flex-col items-center text-center space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-4 py-2 rounded-full backdrop-blur-md"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[11px] uppercase text-zinc-300 font-medium tracking-widest">စနစ်ပုံမှန် အလုပ်လုပ်နေပါသည်</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="space-y-6 max-w-4xl"
          >
            <div className="font-mono text-xs uppercase text-[#FACC15] tracking-[0.2em] font-semibold">
              Blink Movie Recap AI
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.2] md:leading-[1.1] py-2">
              ရုပ်ရှင်များကို မိနစ်ပိုင်းအတွင်း <br className="hidden md:block"/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                အကျဉ်းချုပ် ပြောင်းလဲလိုက်ပါ
              </span>
            </h1>
            <p className="text-base text-zinc-400 md:text-xl max-w-2xl mx-auto leading-relaxed">
              အချိန်ကုန်သက်သာပြီး အရည်အသွေးမြင့်မားတဲ့ ရုပ်ရှင်အကျဉ်းချုပ် ဗီဒီယိုများကို AI အသုံးပြု၍ အလွယ်တကူ ဖန်တီးပါ။
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto pt-4"
          >
            <button
              onClick={onGetAccess}
              className="w-full sm:w-auto group relative bg-white text-black px-8 py-4 rounded-full font-semibold text-base hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              အခုပဲ စတင်အသုံးပြုမယ် <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#process"
              className="w-full sm:w-auto bg-white/[0.03] border border-white/[0.08] text-white px-8 py-4 rounded-full font-medium text-base hover:bg-white/10 transition-colors text-center"
            >
              ဘယ်လိုအလုပ်လုပ်လဲ ကြည့်မယ်
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl pt-12"
          >
            {[
              { value: '~၅ မိနစ်', label: 'ပျမ်းမျှအချိန်' },
              { value: '၂', label: 'မြန်မာအသံများ' },
              { value: 'AI', label: 'နည်းပညာ' }
            ].map((stat, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="font-mono font-bold text-3xl text-white">{stat.value}</div>
                <div className="font-mono text-xs uppercase text-zinc-500 tracking-[0.1em] mt-2">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </section>

        {/* 2. How It Works */}
        <section id="process" className="space-y-16">
          <div className="space-y-4 text-center">
            <div className="font-mono text-xs uppercase text-[#FACC15] tracking-[0.15em] font-semibold">
              How It Works
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Blink ဘယ်လိုအလုပ်လုပ်လဲ</h2>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {[
              {
                num: '01',
                title: 'ဗီဒီယို တင်ပါ',
                desc: 'Gemini မှ ဇာတ်ဝင်ခန်းများကို ဉာဏ်ရည်တုဖြင့် ခွဲခြမ်းစိတ်ဖြာခြင်း',
                badge: 'Gemini Vision API',
              },
              {
                num: '02',
                title: 'AI ဇာတ်ညွှန်း ရေးသားခြင်း',
                desc: 'Llama 3 မှ မြန်မာလို အကျဉ်းချုပ် ဇာတ်ညွှန်း ရေးသားပေးခြင်း',
                badge: 'Groq · Llama 3 70B',
              },
              {
                num: '03',
                title: 'အသံဖန်တီးခြင်း',
                desc: 'မြင့်မြတ် သို့မဟုတ် နေတိုး အသံဖြင့် သဘာဝကျကျ ပြောကြားပေးခြင်း',
                badge: 'Google Cloud TTS',
              },
              {
                num: '04',
                title: 'ဗီဒီယို ထုတ်ယူခြင်း',
                desc: 'အသံနှင့် စာတမ်းထိုးပါဝင်သော ပြီးစီးသွားသည့် ဗီဒီယိုအား ဒေါင်းလုဒ်ရယူပါ',
                badge: 'FFmpeg',
              }
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group relative bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="absolute top-8 right-8 font-mono text-5xl font-black text-white/[0.03] group-hover:text-white/[0.06] transition-colors">
                  {step.num}
                </div>
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-zinc-400 mb-8 leading-relaxed flex-1">{step.desc}</p>
                  <div>
                    <span className="inline-block bg-white/[0.05] border border-white/[0.1] text-zinc-300 font-mono text-xs px-3 py-1.5 rounded-full">
                      {step.badge}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 3. Features */}
        <section id="features" className="space-y-16">
          <div className="space-y-4 text-center">
            <div className="font-mono text-xs uppercase text-[#FACC15] tracking-[0.15em] font-semibold">
              Features
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">အဓိကလုပ်ဆောင်ချက်များ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Video, title: 'ဗီဒီယိုခွဲခြမ်းစိတ်ဖြာမှု', desc: 'ဗီဒီယိုရှိ မြင်ကွင်းများကို AI က အလိုအလျောက် နားလည်မှတ်သားသည်။', badge: 'Gemini Vision' },
              { icon: FileText, title: 'ဇာတ်ညွှန်းရေးသားပေးမှု', desc: 'လူသားတစ်ယောက်ရေးထားသကဲ့သို့ သဘာဝကျသော မြန်မာစာသားများ။', badge: 'Llama 3' },
              { icon: Mic2, title: 'မြန်မာအသံများ', desc: 'ခံစားချက်ပါဝင်ပြီး ရှင်းလင်းပြတ်သားသော အသံထွက်စနစ်။', badge: 'Google TTS' },
              { icon: Download, title: 'လွယ်ကူစွာထုတ်ယူနိုင်မှု', desc: 'ဗီဒီယိုနှင့် အသံကို တိကျစွာ ပေါင်းစပ်ပြီး အလွယ်တကူ ရယူနိုင်သည်။', badge: 'FFmpeg' }
            ].map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 hover:bg-white/[0.04] transition-all flex flex-col h-full group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#FACC15]/10 group-hover:border-[#FACC15]/20 group-hover:text-[#FACC15] transition-all duration-300">
                  <feat.icon size={24} className="text-zinc-300 group-hover:text-[#FACC15] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-zinc-400 flex-1 leading-relaxed">{feat.desc}</p>
                <div className="mt-6 pt-6 border-t border-white/[0.05]">
                  <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                    Powered by {feat.badge}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. Voice Studio Preview */}
        <section id="voices" className="space-y-16">
          <div className="space-y-4 text-center">
            <div className="font-mono text-xs uppercase text-[#FACC15] tracking-[0.15em] font-semibold">
              Voice Studio
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">ရွေးချယ်နိုင်သော အသံများ</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 flex flex-col gap-6 hover:border-white/[0.15] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FACC15]/20 to-transparent border border-[#FACC15]/30 flex items-center justify-center">
                  <Mic2 size={24} className="text-[#FACC15]" />
                </div>
                <div>
                  <div className="font-bold text-white text-xl">Myint Myat</div>
                  <div className="font-mono text-xs text-zinc-500 tracking-wider mt-1">ID: MM-VOICE-01</div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed bg-white/[0.03] p-4 rounded-xl border border-white/[0.05]">
                "တက်ကြွပြီး မြန်ဆန်သော အသံ (Energetic & Fast)"
              </p>
              <div className="flex gap-2">
                <span className="bg-white/[0.05] border border-white/[0.1] text-zinc-300 font-mono text-xs px-3 py-1.5 rounded-full">Pitch +10HZ</span>
                <span className="bg-white/[0.05] border border-white/[0.1] text-zinc-300 font-mono text-xs px-3 py-1.5 rounded-full">Rate +15%</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-8 flex flex-col gap-6 hover:border-white/[0.15] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/30 flex items-center justify-center">
                  <Mic2 size={24} className="text-emerald-400" />
                </div>
                <div>
                  <div className="font-bold text-white text-xl">Nay Toe</div>
                  <div className="font-mono text-xs text-zinc-500 tracking-wider mt-1">ID: MM-VOICE-02</div>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed bg-white/[0.03] p-4 rounded-xl border border-white/[0.05]">
                "တည်ငြိမ်ပြီး လေးနက်သော အသံ (Deep & Calm)"
              </p>
              <div className="flex gap-2">
                <span className="bg-white/[0.05] border border-white/[0.1] text-zinc-300 font-mono text-xs px-3 py-1.5 rounded-full">Pitch -5HZ</span>
                <span className="bg-white/[0.05] border border-white/[0.1] text-zinc-300 font-mono text-xs px-3 py-1.5 rounded-full">Rate +0%</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="space-y-16">
          <div className="space-y-4 text-center">
            <div className="font-mono text-xs uppercase text-[#FACC15] tracking-[0.15em] font-semibold">
              Pricing
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">ရွေးချယ်နိုင်သော အစီအစဉ်များ</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* Free Tier */}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-10 flex flex-col">
              <h3 className="text-xl font-medium text-zinc-400 mb-2">အစမ်းသုံး (Free)</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold text-white">အခမဲ့</span>
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                {[
                  'တစ်လလျှင် ၃ ကား အခမဲ့ ဖန်တီးနိုင်ခြင်း',
                  'အခြေခံ မြန်မာအသံများ အသုံးပြုနိုင်ခြင်း',
                  '720p ဗီဒီယို ထုတ်ယူနိုင်ခြင်း'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-300">
                    <CheckCircle2 size={20} className="text-zinc-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetAccess}
                className="w-full py-4 rounded-full bg-white/[0.03] border border-white/[0.1] text-white font-semibold hover:bg-white/[0.08] transition-colors"
              >
                အခုပဲ စတင်မယ်
              </button>
            </div>

            {/* Pro Tier */}
            <div className="bg-white/[0.04] border border-[#FACC15]/30 rounded-3xl p-10 flex flex-col relative shadow-[0_0_40px_rgba(250,204,21,0.1)]">
              <div className="absolute -top-4 right-8 bg-gradient-to-r from-[#FACC15] to-yellow-600 text-black text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                Most Popular
              </div>
              <h3 className="text-xl font-medium text-[#FACC15] mb-2">ပရို (Pro)</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold text-white">၁၅,၀၀၀</span>
                <span className="text-zinc-500 font-medium">ကျပ် / လ</span>
              </div>
              <ul className="space-y-5 mb-10 flex-1">
                {[
                  'အကန့်အသတ်မရှိ ဗီဒီယိုများ ဖန်တီးနိုင်ခြင်း',
                  'Premium မြန်မာအသံများ အားလုံး အသုံးပြုနိုင်ခြင်း',
                  '1080p နှင့် 4K ဗီဒီယို ထုတ်ယူနိုင်ခြင်း',
                  'ဦးစားပေး ဝန်ဆောင်မှု (Priority Support)'
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-white">
                    <CheckCircle2 size={20} className="text-[#FACC15] shrink-0 mt-0.5" />
                    <span className="leading-relaxed text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <button 
                onClick={onGetAccess}
                className="w-full py-4 rounded-full bg-white text-black font-bold hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Pro သို့ ပြောင်းလဲမယ်
              </button>
            </div>
          </div>
        </section>

        {/* 6. CTA Section */}
        <section>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative bg-white/[0.02] rounded-[2rem] p-10 md:p-16 text-center border border-white/[0.08] overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#FACC15]/5 to-transparent opacity-50 pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-8 relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
                ရုပ်ရှင်အကျဉ်းချုပ်တွေကို <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">အလိုအလျောက် ဖန်တီးဖို့</span> အဆင်သင့်ပဲလား။
              </h2>
              <p className="text-zinc-400 text-base md:text-lg">
                စောင့်ဆိုင်းစာရင်းတွင် ပါဝင်လိုက်ပါ။ (Join the waitlist.)
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
                <input
                  type="email"
                  placeholder="အီးမေးလ် ထည့်ပါ..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.1] rounded-full px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#FACC15]/50 focus:bg-white/[0.05] transition-all"
                />
                <button 
                  onClick={onGetAccess}
                  className="bg-white text-black px-8 py-4 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all whitespace-nowrap"
                >
                  စာရင်းပေးသွင်းမည်
                </button>
              </div>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0B0B0B] py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                <Zap size={14} className="text-black fill-current" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">Blink</span>
            </div>
            <span className="font-mono text-xs text-zinc-500 mt-2">© 2026 Blink AI. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="font-mono text-[10px] text-zinc-400 uppercase tracking-widest font-medium">All systems normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
