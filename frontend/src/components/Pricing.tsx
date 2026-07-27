

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
          <span className="eyebrow-mono">STARTER</span>
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
          
          <a href="https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api" target="_blank" rel="noopener noreferrer" className="btn button-outline-on-dark w-full mt-8">
            Get started
          </a>
        </div>

          {/* Pro Tier (Accent Theme) */}
          <div className="card-feature relative border-[var(--primary)] border-2">
            <div className="absolute top-0 right-0 mt-4 mr-4 bg-[var(--primary)] text-white text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
              Most Popular
            </div>
            
            <div className="eyebrow-mono mb-4 text-[var(--primary)]">PRO</div>
            
            <div className="mb-4">
              <span className="text-4xl font-mono font-bold">$15</span>
              <span className="text-sm font-medium text-[var(--mute)]">/MONTH</span>
            </div>
            
            <p className="body-sm mb-6 text-[var(--mute)]">For professionals ready to hunt.</p>
            
            <div className="dashed-divider my-6"></div>
            
            <ul className="space-y-4 body-sm mb-8">
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[var(--primary)]"></div>
                Everything in Starter
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[var(--primary)]"></div>
                Unlimited API Calls
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[var(--primary)]"></div>
                Advanced Subdomain Enum
              </li>
              <li className="flex items-center gap-3">
                <div className="w-1 h-1 rounded-full bg-[var(--primary)]"></div>
                Priority Support
              </li>
            </ul>
            
            <a href="https://rapidapi.com/BMNTR/api/ultimate-attack-surface-recon-api" target="_blank" rel="noopener noreferrer" className="btn button-primary w-full text-center flex justify-center">
              Start free trial
            </a>
          </div>
      </div>
    </section>
  );
}
