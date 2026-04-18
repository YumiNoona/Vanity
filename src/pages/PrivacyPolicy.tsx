import React from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

export function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-4xl pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12"
      >
        {/* Header */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-syne">Privacy Policy</h1>
              <p className="text-muted-foreground text-sm">
                Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {/* Content */}
        <div className="space-y-10">
          {/* Intro */}
          <Section title="Introduction">
            <p>
              Welcome to <strong className="text-primary">Vanity</strong> ("we," "our," or "us"). We are committed to protecting your privacy and ensuring transparency about how we handle your data. This Privacy Policy explains what information we collect, how we use it, and your choices regarding that data.
            </p>
            <p>
              By using Vanity, you agree to the practices described in this Privacy Policy. If you do not agree with these practices, please do not use our services.
            </p>
          </Section>

          {/* Local Processing */}
          <Section title="Local Processing — Your Files Stay Private">
            <p>
              Vanity processes virtually all files <strong>directly in your web browser</strong>. Your images and PDFs are never uploaded to our servers unless explicitly stated (e.g., the PDF Password tool, which uses a local backend process). We do not store, view, or access your files at any time.
            </p>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm">
              <strong className="text-primary">Key Privacy Promise:</strong> Files processed in Vanity never leave your device. All image editing, format conversion, OCR, compression, and PDF manipulation happens 100% locally using browser APIs and WebAssembly.
            </div>
          </Section>

          {/* Information We Collect */}
          <Section title="Information We Collect">
            <p>We may collect the following types of information:</p>

            <SubSection title="1. Automatically Collected Information">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Device type, browser type, and operating system</li>
                <li>IP address (anonymized where possible)</li>
                <li>Pages visited, time spent on pages, and referral URLs</li>
                <li>General geographic location (city/country level, not precise)</li>
              </ul>
              <p className="mt-3">
                This data is collected through cookies, web beacons, and similar tracking technologies for analytics and advertising purposes.
              </p>
            </SubSection>

            <SubSection title="2. Cookies & Similar Technologies">
              <p>
                Vanity and our third-party partners use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Ensure the website functions correctly</li>
                <li>Remember your preferences (e.g., premium status)</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Serve relevant advertisements via Google AdSense</li>
                <li>Measure the performance and effectiveness of ads</li>
              </ul>
            </SubSection>

            <SubSection title="3. Local Storage">
              <p>
                We use your browser's local storage to save non-sensitive preferences, such as your Vanity Pro upgrade status. This data never leaves your browser and is not transmitted to any server.
              </p>
            </SubSection>
          </Section>

          {/* Google AdSense */}
          <Section title="Google AdSense & Advertising">
            <p>
              We use <strong>Google AdSense</strong> to display advertisements on Vanity. Google AdSense is a third-party advertising service provided by Google LLC.
            </p>

            <SubSection title="How Google AdSense Uses Your Data">
              <p>Google AdSense may use cookies and web beacons to:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Serve ads based on your prior visits to Vanity or other websites</li>
                <li>Use the DoubleClick cookie to enable interest-based advertising</li>
                <li>Allow Google and its partners to serve ads based on your browsing activity</li>
                <li>Collect non-personally identifiable information about your browser and device</li>
              </ul>
            </SubSection>

            <SubSection title="Opting Out of Personalized Ads">
              <p>
                You can opt out of personalized advertising by visiting{" "}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                >
                  Google Ads Settings
                </a>
                . You can also opt out of third-party vendor cookies by visiting the{" "}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                >
                  Digital Advertising Alliance opt-out page
                </a>
                .
              </p>
            </SubSection>

            <SubSection title="Google's Privacy Policy">
              <p>
                For more information about how Google collects and processes data, please review the{" "}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                >
                  Google Privacy Policy
                </a>
                .
              </p>
            </SubSection>
          </Section>

          {/* Cookies Detail */}
          <Section title="Cookie Policy">
            <p>
              Cookies are small text files stored on your device when you visit a website. Below is an overview of the cookies we use:
            </p>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Purpose</th>
                    <th className="text-left py-3 px-4 font-bold text-xs uppercase tracking-widest text-muted-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-medium text-foreground">Essential</td>
                    <td className="py-3 px-4">Required for site functionality and preferences</td>
                    <td className="py-3 px-4">Session / Persistent</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-medium text-foreground">Analytics</td>
                    <td className="py-3 px-4">Help us understand how visitors interact with the site</td>
                    <td className="py-3 px-4">Up to 2 years</td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3 px-4 font-medium text-foreground">Advertising</td>
                    <td className="py-3 px-4">Google AdSense cookies for personalized ad delivery</td>
                    <td className="py-3 px-4">Up to 2 years</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-medium text-foreground">Third-Party</td>
                    <td className="py-3 px-4">Set by Google and advertising partners for ad targeting</td>
                    <td className="py-3 px-4">Varies</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              You can manage or delete cookies through your browser settings. Please note that disabling cookies may affect the functionality of certain features.
            </p>
          </Section>

          {/* Data Sharing */}
          <Section title="How We Share Your Information">
            <p>We do not sell your personal information. We may share limited data with:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong className="text-foreground">Google AdSense / Google LLC</strong> — For serving and measuring advertisements
              </li>
              <li>
                <strong className="text-foreground">Analytics Providers</strong> — To understand site usage and improve our services
              </li>
              <li>
                <strong className="text-foreground">Legal Requirements</strong> — When required by law, legal process, or to protect our rights
              </li>
            </ul>
          </Section>

          {/* Children */}
          <Section title="Children's Privacy">
            <p>
              Vanity is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe we have collected data from a child under 13, please contact us immediately.
            </p>
          </Section>

          {/* Your Rights */}
          <Section title="Your Rights">
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>Access the personal data we hold about you</li>
              <li>Request deletion of your personal data</li>
              <li>Opt out of personalized advertising</li>
              <li>Withdraw consent for cookie-based tracking</li>
              <li>File a complaint with your local data protection authority</li>
            </ul>
          </Section>

          {/* GDPR */}
          <Section title="For EU/EEA Users (GDPR)">
            <p>
              If you are located in the European Union or European Economic Area, you have additional rights under the General Data Protection Regulation (GDPR). We process your data based on legitimate interest (analytics) and consent (advertising cookies). You may withdraw consent at any time by clearing your cookies or using the opt-out links provided above.
            </p>
          </Section>

          {/* CCPA */}
          <Section title="For California Users (CCPA)">
            <p>
              Under the California Consumer Privacy Act (CCPA), California residents have the right to know what personal information is collected, request its deletion, and opt out of its sale. We do not sell personal information. For requests, please contact us using the details below.
            </p>
          </Section>

          {/* Changes */}
          <Section title="Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with a revised "Last updated" date. Your continued use of Vanity after modifications constitutes acceptance of the updated policy.
            </p>
          </Section>

          {/* Contact */}
          <Section title="Contact Us">
            <p>
              If you have any questions or concerns about this Privacy Policy, please reach out to us:
            </p>
            <div className="glass-panel p-6 rounded-xl mt-4 space-y-2">
              <p className="text-foreground font-bold font-syne">Vanity</p>
              <p className="text-muted-foreground text-sm">
                Email: <span className="text-primary">privacy@vanity.tools</span>
              </p>
            </div>
          </Section>
        </div>
      </motion.div>
    </div>
  )
}

/* ─── Subcomponents ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold font-syne flex items-center gap-3">
        <span className="w-6 h-0.5 rounded-full bg-primary inline-block" />
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground pl-9">
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 space-y-3">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      {children}
    </div>
  )
}
