import React from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { palette, radii, typography } from '../../theme';

export default function AppInput({
  label,
  icon,
  multiline = false,
  inputStyle,
  containerStyle,
  ...props
}) {
  return (
    <View style={[styles.group, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.field, multiline && styles.fieldMultiline]}>
        {icon ? <MaterialCommunityIcons name={icon} size={18} color={palette.primary} style={styles.icon} /> : null}
        <TextInput
          placeholderTextColor={palette.inkMuted}
          selectionColor={palette.primary}
          style={[styles.input, multiline && styles.multilineInput, inputStyle]}
          multiline={multiline}
          {...props}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  label: {
    fontFamily: typography.bodySemiBold,
    fontSize: 13,
    color: palette.ink,
  },
  field: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: palette.line,
    paddingHorizontal: 16,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  icon: {
    marginRight: 10,
    marginTop: 2,
  },
  input: {
    flex: 1,
    color: palette.ink,
    fontSize: 15,
    fontFamily: typography.bodyMedium,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        outlineWidth: 0,
      },
    }),
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
});
