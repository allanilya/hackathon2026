import Hero from '@/components/sections/Hero'
import FeatureShowcase from '@/components/sections/FeatureShowcase'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function Home() {
  return (
    <div>
      <Hero />

      <FeatureShowcase />

      {/* Product Demo Section */}
      <section id="demo" className="min-h-screen bg-stone-900 text-white py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-12">
            See Slider in Action
          </h2>
          <div className="bg-stone-800 rounded-card p-8 text-center">
            <p className="text-stone-400 text-lg">
              Interactive demo placeholder — video or animated walkthrough will go here
            </p>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="min-h-screen bg-stone-100 text-stone-900 py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            AI-Powered Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card theme="light" hover>
              <h3 className="text-xl font-bold text-stone-900 mb-3">
                Smart Templates
              </h3>
              <p className="text-stone-600">
                Choose from AI-curated templates that adapt to your content and brand.
              </p>
            </Card>
            <Card theme="light" hover>
              <h3 className="text-xl font-bold text-stone-900 mb-3">
                Auto-Design
              </h3>
              <p className="text-stone-600">
                Let AI handle layouts, spacing, and visual hierarchy for professional results.
              </p>
            </Card>
            <Card theme="light" hover>
              <h3 className="text-xl font-bold text-stone-900 mb-3">
                Content Refiner
              </h3>
              <p className="text-stone-600">
                Polish your messaging with AI suggestions for clarity and impact.
              </p>
            </Card>
            <Card theme="light" hover>
              <h3 className="text-xl font-bold text-stone-900 mb-3">
                Data Visualization
              </h3>
              <p className="text-stone-600">
                Transform data into compelling charts and graphs automatically.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="min-h-screen bg-stone-950 text-white py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center mb-16">
            Built for Every Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card theme="dark" hover>
              <h3 className="text-xl font-bold text-white mb-3">
                Sales Teams
              </h3>
              <p className="text-stone-400">
                Create winning pitch decks that close deals. Customize presentations for every prospect in minutes.
              </p>
            </Card>
            <Card theme="dark" hover>
              <h3 className="text-xl font-bold text-white mb-3">
                Marketing
              </h3>
              <p className="text-stone-400">
                Build campaign decks, reports, and stakeholder presentations that showcase results.
              </p>
            </Card>
            <Card theme="dark" hover>
              <h3 className="text-xl font-bold text-white mb-3">
                Executives
              </h3>
              <p className="text-stone-400">
                Deliver board presentations and strategic updates with polish and confidence.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="min-h-screen flex flex-col items-center justify-center text-center bg-stone-900 text-white py-20 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Presentations?
          </h2>
          <p className="text-xl text-stone-300 mb-8 max-w-2xl mx-auto">
            Join thousands of teams using Slider to create better decks faster.
          </p>
          <Button variant="primary" size="lg">
            Start Building Today
          </Button>
        </div>
      </section>
    </div>
  )
}
