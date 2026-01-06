"use client";

import { FaAmazon, FaApple, FaGithub, FaGoogle, FaMicrosoft, FaPaypal } from "react-icons/fa";
import { FaMeta } from "react-icons/fa6";
import { SiAccenture, SiAdobe, SiAirbnb, SiAtlassian, SiCanva, SiIntel, SiLinkedin, SiNetflix, SiNotion, SiOracle, SiSamsung, SiSpotify, SiStripe, SiTesla, SiUber } from "react-icons/si";
import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { FiFigma } from "react-icons/fi";

function Case() {
  const [api, setApi] = useState<CarouselApi>();
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
    <div className="w-full py-5 lg:py-10 mb-15 mt-[-25px]">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <h2 className="text-xl md:text-3xl md:text-5xl tracking-tighter lg:max-w-xl text-white">
            Trusted by thousands of businesses worldwide
          </h2>

          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {icons.map((Icon, index) => (
                <CarouselItem
                  className="basis-1/5 lg:basis-1/12"
                  key={index}
                >
                  <div className="flex rounded-md aspect-square bg-muted items-center justify-center p-6">
                    <Icon className="w-8 h-8 text-black dark:text-white" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
}

export { Case };
