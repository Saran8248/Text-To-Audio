import React from "react";
import PropTypes from "prop-types";

const HeroBanner = ({
  kicker = "AI AUDIO STUDIO",
  title,
  description,
  pills = [],
  sloganTop = "WORDS",
  sloganBottom = "FIND A VOICE",
  action,
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0d3b66] via-[#006699] to-[#009688] p-7 sm:p-9 text-white shadow-xl">
      {/* Abstract Fluid Curved Wave lines in background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        viewBox="0 0 1000 300"
        preserveAspectRatio="none"
      >
        <path
          d="M0,150 C300,50 600,280 1000,100"
          stroke="url(#hero-wave-grad)"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M0,180 C250,90 550,250 1000,130"
          stroke="url(#hero-wave-grad)"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M0,210 C350,120 650,220 1000,160"
          stroke="url(#hero-wave-grad)"
          strokeWidth="1.5"
          fill="none"
        />
        <defs>
          <linearGradient id="hero-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {/* Flying Dove Silhouette Illustration */}
      <div className="absolute right-12 top-6 pointer-events-none opacity-90 hidden sm:block">
        <svg
          viewBox="0 0 160 120"
          fill="none"
          className="w-36 h-28 text-white drop-shadow-sm"
        >
          <path
            d="M142.5 18.2C130.8 28.5 113.6 37.8 96.2 38.6C82.1 39.2 70.4 34.6 60.1 27.2C50.6 20.4 42.1 11.2 31.5 5.5C28.2 3.7 24.1 2.2 20.8 4.1C18.6 5.3 18.4 8.2 19.5 10.4C24.3 20.2 34.5 28.6 44.8 34.2C53.7 39 64.2 41.5 73.6 44.7C63.2 47.9 51.5 49.8 41.2 46.8C34.7 44.9 28.3 41.3 21.6 40.2C17.4 39.5 12.8 40.8 11.2 44.8C9.8 48.2 12.5 51.7 15.6 53.6C26.5 60.4 40.3 62.1 52.8 62.8C65.4 63.5 78.4 62.2 90.5 58.4C95.2 61.5 100.2 65.2 104.5 69.8C109.8 75.5 113.2 82.8 115.8 90.2C116.8 93.1 118.2 96.2 121.2 97.4C124.6 98.8 128.2 96.7 129.5 93.4C132.8 85.1 131.2 75.2 126.8 67.5C123.6 61.9 119.1 57.2 114.2 53.1C123.8 48.2 134.1 41.5 141.2 32.8C144.5 28.8 147.2 24.1 148.8 19.1C149.2 17.8 147.6 16.2 146.4 16.5C145.1 16.8 143.7 17.4 142.5 18.2Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Far Right Slogan */}
      {(sloganTop || sloganBottom) && (
        <div className="absolute right-8 bottom-6 text-right pointer-events-none hidden md:block">
          {sloganTop && (
            <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-200/80 uppercase">
              {sloganTop}
            </p>
          )}
          {sloganBottom && (
            <p className="text-[9px] font-semibold tracking-[0.25em] text-cyan-200/60 uppercase mt-0.5">
              {sloganBottom}
            </p>
          )}
        </div>
      )}

      {/* Banner Content */}
      <div className="relative z-10">
        {kicker && (
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
            {kicker}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-1 mb-2">
          {title}
        </h1>
        {description && (
          <p className="text-cyan-100 text-sm max-w-xl font-normal">
            {description}
          </p>
        )}

        {/* Frosted Stats / Indicator Pills */}
        {pills && pills.length > 0 && (
          <div className="flex flex-wrap items-center gap-3.5 mt-6">
            {pills.map((pill, index) => {
              const Icon = pill.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 shadow-sm"
                >
                  {Icon && (
                    <div className="p-1.5 rounded-lg bg-white/10 text-cyan-200">
                      <Icon size={18} />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-cyan-200/80 uppercase font-medium">
                      {pill.label}
                    </p>
                    <p className="text-sm font-bold text-white leading-tight">
                      {pill.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Optional Action Slot */}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
};

HeroBanner.propTypes = {
  kicker: PropTypes.string,
  title: PropTypes.node.isRequired,
  description: PropTypes.string,
  pills: PropTypes.arrayOf(
    PropTypes.shape({
      icon: PropTypes.elementType,
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  sloganTop: PropTypes.string,
  sloganBottom: PropTypes.string,
  action: PropTypes.node,
};

export default HeroBanner;
