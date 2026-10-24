import type { Metadata } from "next";
import { SpeakerNotes } from "@/components/pitch/SpeakerNotes";

export const metadata: Metadata = { title: "UworthBetter · 演讲者备注" };

export default function PitchNotesPage() {
  return <SpeakerNotes />;
}
