import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, Clock, Award, MapPin, Phone, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
 const supabase =  await createClient()
  
  // Get popular menu items
  const { data: popularItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('available', true)
    .limit(3)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-rose-50 via-amber-50 to-rose-100 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/1854652/pexels-photo-1854652.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent">
                  Sweet Dreams
                </span>
                <br />
                <span className="text-gray-800">Bakery</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Artisan baked goods made fresh daily with premium ingredients and love. 
                Experience the perfect blend of tradition and innovation in every bite.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/menu">
                  <Button size="lg" className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-8 py-3 text-lg">
                    Order Online
                  </Button>
                </Link>
                <Link href="#about">
                  <Button variant="outline" size="lg" className="border-rose-300 text-rose-700 hover:bg-rose-50 px-8 py-3 text-lg">
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="w-full h-96 rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg"
                  alt="Delicious pastries"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium">5.0 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">About Sweet Dreams</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Since 1985, we've been crafting exceptional baked goods that bring joy to every occasion
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-rose-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Premium Quality</h3>
                <p className="text-gray-600">
                  We use only the finest ingredients sourced from trusted suppliers to ensure exceptional taste and quality.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 border-rose-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Fresh Daily</h3>
                <p className="text-gray-600">
                  Everything is baked fresh every morning using traditional techniques passed down through generations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center p-6 border-rose-100 hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Award Winning</h3>
                <p className="text-gray-600">
                  Recognized by culinary experts and loved by thousands of satisfied customers across the region.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Popular Menu Preview */}
      <section className="py-20 bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Popular Treats</h2>
            <p className="text-xl text-gray-600">Discover our most loved creations</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {popularItems?.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image_url || 'https://images.pexels.com/photos/1055270/pexels-photo-1055270.jpeg'}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{item.name}</h3>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold text-rose-600">${item.price}</span>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Link href="/menu">
              <Button size="lg" className="bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white px-8 py-3">
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Gallery</h2>
            <p className="text-xl text-gray-600">A glimpse into our bakery's artistry</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              'https://images.pexels.com/photos/209196/pexels-photo-209196.jpeg',
              'https://images.pexels.com/photos/1126728/pexels-photo-1126728.jpeg',
              'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg',
              'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg',
              'https://images.pexels.com/photos/1055270/pexels-photo-1055270.jpeg',
              'https://images.pexels.com/photos/1070850/pexels-photo-1070850.jpeg',
              'https://images.pexels.com/photos/461382/pexels-photo-461382.jpeg',
              'https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg'
            ].map((src, index) => (
              <div key={index} className="aspect-square overflow-hidden rounded-lg hover:shadow-lg transition-shadow">
                <img
                  src={src}
                  alt={`Gallery image ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-rose-50 to-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Visit Us Today</h2>
            <p className="text-xl text-gray-600">We'd love to serve you our freshly baked goods</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Location</h3>
                  <p className="text-gray-600">
                    123 Baker Street<br />
                    Downtown District<br />
                    City, State 12345
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Phone</h3>
                  <p className="text-gray-600">(555) 123-CAKE</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Email</h3>
                  <p className="text-gray-600">hello@sweetdreamsbakery.com</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Store Hours</h3>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>6:00 AM - 8:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>7:00 AM - 9:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>8:00 AM - 6:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h3>
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    placeholder="Tell us how we can help you..."
                  ></textarea>
                </div>
                <Button className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white py-3">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}