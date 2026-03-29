'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Crown, Rocket, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for individuals and small teams getting started',
    features: [
      '5 workflows',
      '1,000 executions/month',
      'Basic integrations',
      'Email support',
      'Community access',
    ],
    highlighted: false,
    buttonText: 'Start Free',
    color: 'from-orange-500 to-primary',
  },
  {
    name: 'Professional',
    icon: Crown,
    price: { monthly: 29, yearly: 290 },
    description: 'For growing teams that need more power and flexibility',
    features: [
      'Unlimited workflows',
      '10,000 executions/month',
      'All integrations',
      'Priority support',
      'Advanced analytics',
      'Team collaboration',
      'Custom blocks',
    ],
    highlighted: true,
    buttonText: 'Start Free Trial',
    color: 'from-purple-500 to-orange-600',
  },
  {
    name: 'Enterprise',
    icon: Rocket,
    price: { monthly: 99, yearly: 990 },
    description: 'For large organizations with advanced requirements',
    features: [
      'Unlimited everything',
      'Unlimited executions',
      'Custom integrations',
      'Dedicated support',
      'Advanced security',
      'SSO & SAML',
      'Custom deployment',
      'SLA guarantee',
    ],
    highlighted: false,
    buttonText: 'Contact Sales',
    color: 'from-green-500 to-green-600',
  },
]

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} id='pricing' className='bg-gray-50 py-24'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div
          className={`mb-16 text-center transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className='mb-6 font-bold text-4xl text-gray-900 sm:text-5xl'>
            Simple, transparent
            <br />
            <span className='bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent'>
              pricing
            </span>
          </h2>
          <p className='mx-auto mb-8 max-w-3xl text-gray-600 text-xl'>
            Start free, scale as you grow. No hidden fees, no surprise charges. Cancel anytime with
            no questions asked.
          </p>

          {/* Billing Toggle */}
          <div className='inline-flex items-center rounded-full border border-gray-200 bg-white p-1'>
            <button
              onClick={() => setIsYearly(false)}
              className={`rounded-full px-6 py-2 font-medium text-sm transition-all duration-300 ${
                !isYearly ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`relative rounded-full px-6 py-2 font-medium text-sm transition-all duration-300 ${
                isYearly ? 'bg-primary text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className='-top-2 -right-2 absolute rounded-full bg-green-500 px-2 py-0.5 text-white text-xs'>
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className='mx-auto grid max-w-6xl gap-8 lg:grid-cols-3'>
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const price = isYearly ? plan.price.yearly : plan.price.monthly
            const savings =
              isYearly && plan.price.monthly > 0 ? plan.price.monthly * 12 - plan.price.yearly : 0

            return (
              <div
                key={plan.name}
                className={`relative rounded-3xl transition-all duration-1000 ${
                  isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                } ${
                  plan.highlighted
                    ? 'scale-105 bg-gradient-to-br from-primary to-orange-600 text-white shadow-2xl'
                    : 'bg-white text-gray-900 shadow-lg hover:shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {plan.highlighted && (
                  <div className='-top-4 -translate-x-1/2 absolute left-1/2 transform'>
                    <div className='rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-2 font-semibold text-sm text-white'>
                      Most Popular
                    </div>
                  </div>
                )}

                <div className='p-8'>
                  {/* Plan Header */}
                  <div className='mb-8 text-center'>
                    <div
                      className={`mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-r ${plan.color} p-4 ${
                        plan.highlighted ? 'bg-white/20' : ''
                      }`}
                    >
                      <Icon
                        className={`h-8 w-8 ${plan.highlighted ? 'text-white' : 'text-white'}`}
                      />
                    </div>
                    <h3 className='mb-2 font-bold text-2xl'>{plan.name}</h3>
                    <p
                      className={`text-sm ${plan.highlighted ? 'text-primary/80' : 'text-gray-600'}`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className='mb-8 text-center'>
                    <div className='flex items-baseline justify-center'>
                      <span className='font-bold text-5xl'>${price}</span>
                      <span
                        className={`ml-2 ${plan.highlighted ? 'text-primary/80' : 'text-gray-600'}`}
                      >
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    {savings > 0 && (
                      <div className='mt-2 font-medium text-green-400 text-sm'>
                        Save ${savings}/year
                      </div>
                    )}
                  </div>

                  {/* Features */}
                  <ul className='mb-8 space-y-4'>
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className='flex items-start'>
                        <Check
                          className={`mt-0.5 mr-3 h-5 w-5 flex-shrink-0 ${
                            plan.highlighted ? 'text-green-300' : 'text-green-500'
                          }`}
                        />
                        <span
                          className={`text-sm ${plan.highlighted ? 'text-primary/80' : 'text-gray-600'}`}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    className={`w-full rounded-full py-3 font-semibold transition-all duration-300 ${
                      plan.highlighted
                        ? 'bg-white text-primary hover:bg-gray-50'
                        : 'bg-primary text-white hover:bg-primary/90'
                    }`}
                  >
                    {plan.buttonText}
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ Link */}
        <div
          className={`mt-16 text-center transition-all delay-600 duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <p className='mb-4 text-gray-600'>
            Have questions about our pricing? We're here to help.
          </p>
          <button className='font-medium text-primary hover:text-primary'>View FAQ →</button>
        </div>
      </div>
    </section>
  )
}
