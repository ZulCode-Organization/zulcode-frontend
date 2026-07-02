"use client";

import ButtonGroup from "@/components/blocks/welcome-button-group";
import WelcomeHero from "@/components/blocks/welcome-hero";

const buttonGroupData = { 
  labelPrimary: "COMEÇAR AGORA",
  linkPrimary: "/signup",
  labelSecond: "JÁ TENHO UMA CONTA",
  linkSecond: "/login"
};

export default function Welcome() {
  return (
    <div className="flex flex-col p-[32px] gap-[32px] sm:gap-[64px] justify-center items-center h-full w-full sm:w-lg sm:mx-auto">
      <WelcomeHero />
      <ButtonGroup data={buttonGroupData} />
    </div>
  );
}