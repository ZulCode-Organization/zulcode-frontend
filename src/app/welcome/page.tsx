"use client";

import ButtonGroup from "@/components/blocks/welcome-button-group";
import WelcomeHero from "@/components/blocks/welcome-hero";

const buttonGroupData = {
  labelPrimary: "COMEÇAR AGORA",
  linkPrimary: "/signup",
  labelSecond: "JÁ TENHO UMA CONTA",
  linkSecond: "/login",
};

export default function Welcome() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden p-8">
      <div className="relative flex w-full flex-col items-center justify-center gap-8 sm:mx-auto sm:w-lg sm:gap-16">
        <WelcomeHero />
        <ButtonGroup data={buttonGroupData} />
      </div>
    </div>
  );
}
