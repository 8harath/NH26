import Link from 'next/link'
import { Mail, Zap, Settings, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Mail className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MailMate</h1>
            <p className="text-sm text-gray-600">AI-powered email assistant</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="space-y-12">
          {/* Hero Section */}
          <section className="text-center space-y-6">
            <h2 className="text-4xl font-bold text-gray-900">Welcome to MailMate</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your AI-powered email companion. Automatically triage threads, extract action items,
              draft replies, and stay on top of what matters — all in one intelligent inbox.
            </p>
          </section>

          {/* Two Options */}
          <section className="grid md:grid-cols-2 gap-8">
            {/* Demo Version */}
            <div className="border border-blue-200 rounded-lg p-8 bg-blue-50">
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Interactive Demo</h3>
              </div>
              <p className="text-gray-600 mb-6">
                See MailMate in action with pre-loaded sample emails and mock AI analysis. No API key required.
              </p>
              <ul className="space-y-2 mb-8 text-sm text-gray-700">
                <li>✓ Full working interface</li>
                <li>✓ Sample email threads</li>
                <li>✓ Mock AI-generated actions</li>
                <li>✓ No setup needed</li>
              </ul>
              <Link href="/demo">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2">
                  Launch Demo <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            {/* Real Version */}
            <div className="border border-gray-200 rounded-lg p-8 bg-gray-50">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-bold text-gray-900">Full Application</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Integrate with Groq AI to analyze real emails. Requires API key configuration.
              </p>
              <ul className="space-y-2 mb-8 text-sm text-gray-700">
                <li>✓ Real Groq AI integration</li>
                <li>✓ Live email analysis</li>
                <li>✓ Dynamic action generation</li>
                <li>✓ Production-ready</li>
              </ul>
              <Link href="/inbox">
                <Button variant="outline" className="w-full gap-2">
                  Launch Full App <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </section>

          {/* Setup Instructions */}
          <section id="setup" className="bg-white border border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Setup the Full Application</h3>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Get a Groq API Key</h4>
                <p className="text-gray-600 mb-3">
                  Visit{' '}
                  <a
                    href="https://console.groq.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    console.groq.com
                  </a>{' '}
                  and create a free account to get your API key.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Add the Environment Variable</h4>
                <p className="text-gray-600 mb-3">Add your Groq API key to your environment:</p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  GROQ_API_KEY=your_api_key_here
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Navigate to the Full App</h4>
                <p className="text-gray-600 mb-3">
                  Once your API key is configured, use the navigation to access the full application. MailMate will
                  analyze emails in real-time with Groq AI.
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> MailMate is set up and ready to use. Simply add your Groq API key and
                  you're good to go.
                </p>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Smart Triage</h4>
                <p className="text-gray-600 text-sm">
                  AI-powered thread summaries with priority classification (Urgent, Action, FYI)
                </p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Auto Actions</h4>
                <p className="text-gray-600 text-sm">
                  Automatically generate reply drafts, calendar events, and task extraction
                </p>
              </div>
              <div className="p-6 border border-gray-200 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Human-in-the-Loop</h4>
                <p className="text-gray-600 text-sm">
                  Review, edit, approve, or regenerate AI suggestions before taking action
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-20 py-8 px-6">
        <div className="max-w-6xl mx-auto text-center text-gray-600 text-sm">
          <p>MailMate &bull; AI Email Assistant &bull; Built with Next.js and Groq AI</p>
        </div>
      </footer>
    </main>
  )
}
