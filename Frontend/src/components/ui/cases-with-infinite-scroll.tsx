"use client";

import { FaAmazon, FaApple, FaGithub, FaGoogle, FaMicrosoft, FaPaypal } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import { SiAccenture, SiAdobe, SiAirbnb, SiAtlassian, SiCanva, SiIntel, SiLinkedin, SiNetflix, SiNotion, SiOracle, SiSamsung, SiSpotify, SiStripe, SiTesla, SiUber } from "react-icons/si";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { FiFigma } from "react-icons/fi";
import { EmblaCarouselType } from "embla-carousel";

function Case() {
  const [api, setApi] = useState<EmblaCarouselType>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent((c) => c + 1);
      }
    }, 1000);
  }, [api, current]);

  const icons = [
    FaGoogle,
    FaMicrosoft,
    FaApple,
    FaMeta,
    FaGithub,
    SiAccenture,
    SiNetflix,
    SiAdobe,
    SiIntel,
    SiSpotify,
    SiUber,
    FiFigma,
    SiAtlassian,
    SiSamsung,
    SiTesla,
    SiNotion,
    SiCanva,
    SiLinkedin,
    SiStripe,
    SiAirbnb,
    FaAmazon,
    FaPaypal,
    SiOracle,
  ];

  return (
    <div className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-black">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-12">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              Trusted by developers worldwide
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Join thousands of developers and teams who build amazing projects with DevSpace
            </p>
          </div>

          <div className="relative overflow-hidden">
            {/* Gradient fade effects */}
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10"></div>
            
            <Carousel setApi={setApi} className="w-full">
              <CarouselContent className="-ml-4">
                {icons.map((Icon, index) => (
                  <CarouselItem
                    className="basis-1/3 sm:basis-1/4 md:basis-1/6 lg:basis-1/8 pl-4"
                    key={index}
                  >
                    <div className="flex items-center justify-center p-6 group">
                      <Icon className="w-8 h-8 text-gray-400 group-hover:text-blue-400 transition-colors duration-300" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    </div>
  );}

export { Case };
