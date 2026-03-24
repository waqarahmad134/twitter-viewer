import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-24 px-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cpath fill=\'%23ffffff\' fill-opacity=\'0.03\' d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <p className="text-sky-400 font-medium mb-4">✨ Clean, Private Browsing — No Ads</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
            View Twitter Without an Account
          </h1>
          <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
            Track counts, explore media, and find key posts. A lightweight, browser-based way to view Twitter.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/twitter-profile-viewer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors"
            >
              View Profile
            </Link>
            <Link
              href="/twitter-tweet-viewer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-colors"
            >
              View Tweet
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-12">
            How to View Twitter Without Account
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <span className="inline-flex w-12 h-12 rounded-full bg-sky-100 text-sky-600 font-bold items-center justify-center text-lg mb-4">
                1
              </span>
              <h3 className="font-display font-semibold text-lg mb-2">
                Drop a Handle or Link
              </h3>
              <p className="text-x-gray">
                Paste @username or https://x.com/username with no account needed.
              </p>
            </div>
            <div className="text-center">
              <span className="inline-flex w-12 h-12 rounded-full bg-sky-100 text-sky-600 font-bold items-center justify-center text-lg mb-4">
                2
              </span>
              <h3 className="font-display font-semibold text-lg mb-2">
                Pick Your Viewer
              </h3>
              <p className="text-x-gray">
                Choose Profile Viewer or Tweet Viewer whichever you need.
              </p>
            </div>
            <div className="text-center">
              <span className="inline-flex w-12 h-12 rounded-full bg-sky-100 text-sky-600 font-bold items-center justify-center text-lg mb-4">
                3
              </span>
              <h3 className="font-display font-semibold text-lg mb-2">
                Get Instant Intel
              </h3>
              <p className="text-x-gray">
                See all the numbers in one clean page — fast, simple, hassle free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-center mb-12">
            Why Choose Our Twitter Viewer?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Quantitative Insights",
                desc: "Get clear numbers for posts, comments, and media in seconds.",
                icon: "📊",
              },
              {
                title: "Private & Unrestricted",
                desc: "Browse profiles without logging in or creating an account.",
                icon: "🔒",
              },
              {
                title: "Instant Results",
                desc: "Access the data you need quickly, without delays or distractions.",
                icon: "⚡",
              },
              {
                title: "Clean Summary View",
                desc: "See all key information on one tidy, easy-to-read page.",
                icon: "📄",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"
              >
                <span className="text-2xl mb-3 block">{item.icon}</span>
                <h3 className="font-display font-semibold mb-2">{item.title}</h3>
                <p className="text-x-gray text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold mb-4">
            Explore Twitter Like Never Before
          </h2>
          <p className="text-x-gray mb-8">
            No logins, no distractions. Dive into profiles and tweets, check engagement data, and explore media activity — all in one place, completely free.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/twitter-profile-viewer"
              className="px-6 py-3 bg-x-blue hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              View Profile
            </Link>
            <Link
              href="/twitter-tweet-viewer"
              className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-x-black font-semibold rounded-lg transition-colors"
            >
              View Tweet
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
