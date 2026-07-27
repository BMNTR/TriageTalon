

export default function Pricing() {
  return (
    <section className="py-20 px-8 max-w-5xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="display-lg">Pricing Tiers</h2>
        <p className="body-md mt-4 text-mute">Simple pricing. Scale as you grow.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Starter Tier */}
        <div className="card-feature flex flex-col">
          <span className="eyebrow-mono">/0.1 - STARTER</span>
          <div className="display-lg mt-4 mb-2">
            $0<span className="body-sm text-mute"> / MONTH</span>
          </div>
          <p className="body-md mb-8">For individuals getting started.</p>

          <div className="flex-1">
            <div className="hairline-divider"></div>
            <ul className="space-y-4 my-6">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="body-sm">100 API Calls / Month</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="body-sm">Basic Security Grading</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="body-sm">Community Support</span>
              </li>
            </ul>
          </div>
          
          <a href="https://rapidapi.com/" target="_blank" rel="noopener noreferrer" className="btn button-outline-on-dark w-full mt-8">
            Get started
          </a>
        </div>

        {/* Pro Tier (Flipped Polarity) */}
        <div className="card-inverted flex flex-col relative">
          <div className="flex justify-between items-center">
            <span className="eyebrow-mono m-0" style={{ color: '#ff3e00' }}>/0.2 - PRO</span>
            <span className="text-[10px] font-semibold px-2 py-1 bg-[#101010] text-[#ff3e00] rounded-sm tracking-wider">MOST POPULAR</span>
          </div>
          <div className="display-lg mt-4 mb-2 text-[#101010]">
            $15<span className="body-sm text-[#101010]/60"> / MONTH</span>
          </div>
          <p className="body-md mb-8 text-[#101010]/80">For professionals ready to hunt.</p>

          <div className="flex-1">
            <div className="hairline-divider" style={{ borderColor: 'rgba(16,16,16,0.15)' }}></div>
            <ul className="space-y-4 my-6">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#101010]"></span>
                <span className="body-sm text-[#101010]">Everything in Starter</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#101010]"></span>
                <span className="body-sm text-[#101010]">Unlimited API Calls</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#101010]"></span>
                <span className="body-sm text-[#101010]">Advanced Subdomain Enum</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#101010]"></span>
                <span className="body-sm text-[#101010]">Priority Support</span>
              </li>
            </ul>
          </div>

          <a href="https://rapidapi.com/" target="_blank" rel="noopener noreferrer" className="btn button-inverted w-full mt-8">
            Start free trial
          </a>
        </div>
      </div>
    </section>
  );
}
