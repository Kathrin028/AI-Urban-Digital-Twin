import heroImage from "../../assets/images/hero.png";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-[#F8FAFC]">
      <div className="flex h-full flex-col lg:flex-row">
        
        {/* Left Side - Auth Form */}
        <div className="flex w-full lg:w-[45%] xl:w-[40%] lg:h-full items-center justify-center p-8 sm:p-12 xl:p-16 bg-white relative z-10 shadow-2xl shadow-slate-200/50 overflow-y-auto">
          <div className="w-full max-w-[440px] my-auto">
            {/* Mobile Logo */}
            <div className="lg:hidden mb-10 text-center">
              <h1 className="text-[32px] font-bold text-slate-900 tracking-tight">
                UrbanMind<span className="text-blue-600">.AI</span>
              </h1>
            </div>
            
            {children}
          </div>
        </div>

        {/* Right Side - Branding */}
        <div className="hidden lg:flex flex-col px-12 xl:px-24 flex-1 bg-[#0F172A] text-white overflow-hidden relative">
          
          {/* Decorative background circle */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-600/20 blur-[120px]"></div>
            <div className="absolute top-[60%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px]"></div>
          </div>

          <div className="relative z-10 max-w-xl mx-auto w-full h-full flex flex-col justify-center py-8">
            <div className="flex-none mb-8">
              <span className="inline-flex w-fit rounded-full bg-blue-500/20 px-4 py-1.5 text-[14px] font-semibold text-blue-300 border border-blue-500/30">
                UrbanMind.AI Platform
              </span>

              <h1 className="mt-6 text-[40px] xl:text-[52px] font-bold leading-[1.1] text-white tracking-tight">
                Smarter Cities
                <span className="block text-blue-400 mt-2">
                  Powered by AI
                </span>
              </h1>

              <p className="mt-4 text-[16px] xl:text-[18px] leading-relaxed text-slate-300">
                A comprehensive platform to monitor, analyze, and resolve civic complaints with intelligent insights.
              </p>
            </div>

            <div className="rounded-3xl overflow-hidden border border-slate-700/50 shadow-2xl shadow-blue-900/20 bg-slate-800 relative group flex-shrink min-h-0 max-h-[45vh]">
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-60 z-10 pointer-events-none"></div>
              <img
                src={heroImage}
                alt="UrbanMind AI Dashboard"
                className="w-full h-full object-cover object-top opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}