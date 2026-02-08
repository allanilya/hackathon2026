interface FeatureSlideProps {
  icon: React.ReactNode   // SVG icon or illustration
  title: string           // Feature heading
  description: string     // Feature body text
}

export function FeatureSlide({ icon, title, description }: FeatureSlideProps) {
  return (
    <div className="feature-slide min-w-full h-full flex flex-col items-center justify-center px-6 sm:px-8 lg:px-16 motion-reduce:min-w-0 motion-reduce:min-h-[60vh] motion-reduce:py-16">
      <div className="max-w-2xl text-center space-y-6">
        {/* Icon container */}
        <div className="w-20 h-20 lg:w-28 lg:h-28 mx-auto text-burnt-orange">
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-3xl lg:text-5xl font-bold text-white leading-tight">
          {title}
        </h3>

        {/* Description */}
        <p className="text-lg lg:text-xl text-stone-300 max-w-xl mx-auto">
          {description}
        </p>
      </div>
    </div>
  )
}
