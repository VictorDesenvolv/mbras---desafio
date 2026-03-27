import React from "react";
import { View, Text } from "react-native";

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 5, height: 5 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 5,
};

const CHIP_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 2, height: 2 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 2,
};

export default function DistributionBar({ distribution }) {
  const { positive, negative, neutral } = distribution;

  return (
    <View
      className="bg-neo-card rounded-lg p-5 mb-4"
      style={{ ...CARD_SHADOW, borderWidth: 3, borderColor: "#000" }}
    >
      <Text className="text-base font-black text-neo-black uppercase tracking-wider mb-4">
        Distribuição
      </Text>

      <View
        className="flex-row h-10 rounded overflow-hidden border-2 border-neo-black"
      >
        {positive > 0 && (
          <View className="justify-center items-center bg-neo-green" style={{ flex: positive }}>
            {positive >= 12 && (
              <Text className="text-neo-black text-[11px] font-black">{positive.toFixed(0)}%</Text>
            )}
          </View>
        )}
        {neutral > 0 && (
          <View className="justify-center items-center bg-gray-300" style={{ flex: neutral }}>
            {neutral >= 12 && (
              <Text className="text-neo-black text-[11px] font-black">{neutral.toFixed(0)}%</Text>
            )}
          </View>
        )}
        {negative > 0 && (
          <View className="justify-center items-center bg-neo-red" style={{ flex: negative }}>
            {negative >= 12 && (
              <Text className="text-neo-black text-[11px] font-black">{negative.toFixed(0)}%</Text>
            )}
          </View>
        )}
      </View>

      <View className="flex-row justify-around mt-4">
        <LegendChip bg="bg-neo-green" label="Positivo" value={positive} />
        <LegendChip bg="bg-gray-300" label="Neutro" value={neutral} />
        <LegendChip bg="bg-neo-red" label="Negativo" value={negative} />
      </View>
    </View>
  );
}

function LegendChip({ bg, label, value }) {
  return (
    <View
      className={`flex-row items-center px-2.5 py-1 rounded border-2 border-neo-black ${bg}`}
      style={CHIP_SHADOW}
    >
      <Text className="text-[11px] font-black text-neo-black">
        {label} {value.toFixed(0)}%
      </Text>
    </View>
  );
}
