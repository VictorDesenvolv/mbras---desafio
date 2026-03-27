import React from "react";
import { View, Text } from "react-native";

const LABEL_CONFIG = {
  positive: { bg: "bg-neo-green", icon: "😊", label: "POSITIVO" },
  negative: { bg: "bg-neo-red", icon: "😞", label: "NEGATIVO" },
  neutral: { bg: "bg-gray-300", icon: "😐", label: "NEUTRO" },
  meta: { bg: "bg-neo-purple", icon: "🎯", label: "META" },
};

export default function SentimentBadge({ label, score }) {
  const config = LABEL_CONFIG[label] || LABEL_CONFIG.neutral;

  return (
    <View
      className={`flex-row items-center px-3 py-1.5 rounded-md self-start border-2 border-neo-black ${config.bg}`}
      style={{ shadowColor: "#000", shadowOffset: { width: 2, height: 2 }, shadowOpacity: 1, shadowRadius: 0, elevation: 3 }}
    >
      <Text className="text-sm mr-1">{config.icon}</Text>
      <Text className="text-[11px] font-black text-neo-black tracking-wide">{config.label}</Text>
      {score !== undefined && (
        <Text className="text-[10px] font-bold text-neo-black ml-1.5">
          {score > 0 ? "+" : ""}{score.toFixed(2)}
        </Text>
      )}
    </View>
  );
}
