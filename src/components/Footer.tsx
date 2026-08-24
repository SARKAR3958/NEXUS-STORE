import { Link } from "react-router-dom";
import { ASSETS } from "@/assets";

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 mt-20 transition-colors duration-300">
      <div className="w-full max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-3">
              <img 
                src={ASSETS.headerLogo} 
                alt="Nexus Store" 
                className="h-8 max-h-9 w-auto object-contain"
              />
              <span className="text-3xl font-bebas tracking-widest text-slate-900 dark:text-white">
                NEXUS STORE<span className="text-emerald-600 dark:text-emerald-500">.</span>
              </span>
            </Link>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-sm font-light">
              Premium digital assets, source codes, and custom development services crafted with precision and care.
            </p>
          </div>
          <div>
            <h3 className="font-bebas tracking-wider text-xl text-slate-900 dark:text-white mb-4">Shop</h3>
            <ul className="space-y-3 text-slate-500 dark:text-slate-400">
              <li><Link to="/products?cat=apps" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Apps</Link></li>
              <li><Link to="/products?cat=websites" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Websites</Link></li>
              <li><Link to="/products?cat=custom" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Custom Apps</Link></li>
              <li><Link to="/products?cat=source" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Source Code</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bebas tracking-wider text-xl text-slate-900 dark:text-white mb-4">Company</h3>
            <ul className="space-y-3 text-slate-500 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contact</Link></li>
              <li><Link to="/terms" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Nexus Store. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Dribbble</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
