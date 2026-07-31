import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Input } from "@/components/ui";
import { Feather } from "@expo/vector-icons";
import { COUNTRY_CODES } from "@/lib/constants/countries";

export interface CountryCode {
  code: string;
  flag: string;
  country: string;
}

interface PhoneInputProps {
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  leftIcon?: React.ReactNode;
}

export default function PhoneInput({
  selectedCountry,
  onCountryChange,
  phoneNumber,
  onPhoneChange,
  leftIcon,
}: PhoneInputProps) {
  const [showCountries, setShowCountries] = useState(false);


  return (
    <>
      {leftIcon && 
      <View className="mr-2">{leftIcon}</View>
      }

      <Text className="text-gray-300 text-sm font-medium mb-2">
        Country
      </Text>

      <TouchableOpacity
            className="flex-row items-center bg-primary-light rounded-2xl px-5 h-16 mb-4"
            onPress={() => setShowCountries(!showCountries)}
            >
            <Text className="text-2xl mr-4">
                {selectedCountry.flag}
            </Text>

            <View className="flex-1">
                <Text className="text-white font-semibold text-base">
                {selectedCountry.country}
                </Text>

                <Text className="text-slate-400">
                {selectedCountry.code}
                </Text>
            </View>

            <Feather
                name={showCountries ? "chevron-up" : "chevron-down"}
                size={22}
                color="#94A3B8"
            />
        </TouchableOpacity>

      {showCountries && (
        <View className="bg-primary-light rounded-2xl mb-4 overflow-hidden">
          {COUNTRY_CODES.map((country) => (
            <TouchableOpacity
                key={country.code}
                className="flex-row items-center px-5 py-4 border-b border-slate-700"
                onPress={() => {
                onCountryChange(country);
                setShowCountries(false);
                }}
            >
                <Text className="text-2xl mr-4">{country.flag}</Text>

                <View className="flex-1">
                <Text className="text-white font-medium">
                    {country.country}
                </Text>
                <Text className="text-slate-400 text-sm">
                    {country.code}
                </Text>
                </View>

                {selectedCountry.code === country.code && (
                <Feather
                    name="check"
                    size={20}
                    color="#F5A623"
                />
                )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Input
        label="Phone Number"
        placeholder="7XX XXX XXX"
        keyboardType="phone-pad"
        value={phoneNumber}
        onChangeText={onPhoneChange}
        leftIcon={
          <Text className="text-slate-400 font-semibold">
            {selectedCountry.code}
          </Text>
        }
        maxLength={10}
      />
    </>
  );
}
