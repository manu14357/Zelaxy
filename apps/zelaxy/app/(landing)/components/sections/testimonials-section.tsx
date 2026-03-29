'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Quote, Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Head of Operations',
    company: 'TechCorp',
    avatar: 'SC',
    content:
      'Zelaxy transformed our customer onboarding process. What used to take hours now happens automatically in minutes. Our team can focus on what really matters.',
    rating: 5,
    metrics: { improvement: '80%', timeSaved: '15hrs/week' },
  },
  {
    name: 'Marcus Rodriguez',
    role: 'Marketing Director',
    company: 'GrowthLabs',
    avatar: 'MR',
    content:
      "The AI-powered lead qualification has been a game-changer. We're converting 40% more leads with half the manual work. It's like having a super-smart assistant.",
    rating: 5,
    metrics: { improvement: '40%', timeSaved: '20hrs/week' },
  },
  {
    name: 'Emily Johnson',
    role: 'VP of Engineering',
    company: 'DevFlow',
    avatar: 'EJ',
    content:
      'Real-time collaboration on workflows is incredible. Our distributed team can work together seamlessly, and the visual builder makes complex automations simple.',
    rating: 5,
    metrics: { improvement: '60%', timeSaved: '25hrs/week' },
  },
  {
    name: 'David Kim',
    role: 'Founder & CEO',
    company: 'StartupX',
    avatar: 'DK',
    content:
      'As a startup, efficiency is everything. Zelaxy helped us automate our entire sales pipeline, allowing us to scale without hiring more staff.',
    rating: 5,
    metrics: { improvement: '90%', timeSaved: '30hrs/week' },
  },
]

export function TestimonialsSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
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

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  return (
    <section
      ref={sectionRef}
      className='bg-white py-24 transition-colors duration-500 dark:bg-gray-900'
    >
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
        {/* Section Header */}
        <div
          className={`mb-16 text-center transition-all duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <h2 className='mb-6 font-bold text-4xl text-gray-900 sm:text-5xl dark:text-white'>
            Loved by teams
            <br />
            <span className='bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent dark:from-primary dark:to-purple-400'>
              worldwide
            </span>
          </h2>
          <p className='mx-auto max-w-3xl text-gray-600 text-xl dark:text-gray-300'>
            Join thousands of teams who have transformed their workflows with Zelaxy. See what they
            have to say about their experience.
          </p>
        </div>

        {/* Main Testimonial */}
        <div
          className={`relative mx-auto mb-16 max-w-4xl transition-all delay-300 duration-1000 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 p-8 md:p-12'>
            {/* Quote Icon */}
            <div className='absolute top-8 left-8 opacity-10'>
              <Quote className='h-16 w-16 text-primary' />
            </div>

            {/* Content */}
            <div className='relative z-10'>
              {/* Stars */}
              <div className='mb-6 flex items-center'>
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className='h-5 w-5 fill-current text-yellow-400' />
                ))}
              </div>

              {/* Testimonial Text */}
              <blockquote className='mb-8 font-medium text-gray-900 text-xl leading-relaxed md:text-2xl'>
                "{testimonials[currentTestimonial].content}"
              </blockquote>

              {/* Author Info */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <div className='mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-primary to-orange-600 font-semibold text-white'>
                    {testimonials[currentTestimonial].avatar}
                  </div>
                  <div>
                    <div className='font-semibold text-gray-900'>
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className='text-gray-600'>
                      {testimonials[currentTestimonial].role} at{' '}
                      {testimonials[currentTestimonial].company}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className='hidden items-center space-x-6 md:flex'>
                  <div className='text-center'>
                    <div className='font-bold text-2xl text-primary'>
                      {testimonials[currentTestimonial].metrics.improvement}
                    </div>
                    <div className='text-gray-600 text-sm'>Improvement</div>
                  </div>
                  <div className='text-center'>
                    <div className='font-bold text-2xl text-purple-600'>
                      {testimonials[currentTestimonial].metrics.timeSaved}
                    </div>
                    <div className='text-gray-600 text-sm'>Time Saved</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className='mt-8 flex items-center justify-center space-x-4'>
            <button
              onClick={prevTestimonial}
              className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg transition-colors hover:text-gray-900'
              aria-label='Previous testimonial'
            >
              <ArrowLeft className='h-5 w-5' />
            </button>

            {/* Dots */}
            <div className='flex space-x-2'>
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentTestimonial(index)
                    setIsAutoPlaying(false)
                  }}
                  className={`h-2 w-2 rounded-full transition-all duration-300 ${
                    currentTestimonial === index
                      ? 'w-8 bg-primary'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              className='flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 shadow-lg transition-colors hover:text-gray-900'
              aria-label='Next testimonial'
            >
              <ArrowRight className='h-5 w-5' />
            </button>
          </div>
        </div>

        {/* All Testimonials Grid */}
        <div
          className={`grid gap-6 transition-all delay-500 duration-1000 md:grid-cols-2 lg:grid-cols-4 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          }`}
        >
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`cursor-pointer rounded-2xl border-2 bg-white p-6 transition-all duration-300 ${
                currentTestimonial === index
                  ? 'border-primary/30 shadow-lg'
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
              }`}
              onClick={() => {
                setCurrentTestimonial(index)
                setIsAutoPlaying(false)
              }}
            >
              <div className='mb-4 flex items-center'>
                <div className='mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-orange-600 font-semibold text-sm text-white'>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className='font-semibold text-gray-900 text-sm'>{testimonial.name}</div>
                  <div className='text-gray-600 text-xs'>{testimonial.company}</div>
                </div>
              </div>
              <div className='mb-3 flex items-center'>
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className='h-4 w-4 fill-current text-yellow-400' />
                ))}
              </div>
              <p className='line-clamp-3 text-gray-600 text-sm leading-relaxed'>
                {testimonial.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
