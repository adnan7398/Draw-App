import { useState, useEffect } from 'react';
import { StylingState, GradientType, StrokePattern, Shape } from '@/component/types';
import { Game } from '@/draw/Game';

export function useStylingState(game: Game | undefined, selectedShape: Shape | null) {
  const [stylingState, setStylingState] = useState<StylingState>({
    selectedColorType: 'stroke',
    fillColor: "transparent",
    strokeColor: "#1976D2",
    strokeWidth: 2,
    opacity: 1,
    strokeStyle: "solid",
    gradientType: "none",
    gradientColors: ["#FF6B6B", "#4ECDC4"],
    textColor: "#1565C0",
    designColor: "#1E293B"
  });

  // Sync state when selection changes
  useEffect(() => {
    if (selectedShape) {
      setStylingState(prev => ({
        ...prev,
        fillColor: selectedShape.style?.fillColor || prev.fillColor,
        strokeColor: selectedShape.style?.strokeColor || prev.strokeColor,
        strokeWidth: selectedShape.style?.strokeWidth || prev.strokeWidth,
        opacity: selectedShape.style?.opacity ?? prev.opacity,
        strokeStyle: selectedShape.style?.strokeStyle.type || prev.strokeStyle,
        textColor: selectedShape.type === 'text' ? (selectedShape.style?.textColor || (selectedShape as any).color || prev.textColor) : prev.textColor
      }));
    }
  }, [selectedShape]);

  // Apply styling changes to game
  useEffect(() => {
    if (game) {
      game.setFillColor(stylingState.fillColor);
      game.setStrokeColor(stylingState.strokeColor);
      game.setStrokeWidth(stylingState.strokeWidth);
      game.setOpacity(stylingState.opacity);
      game.setStrokeStyle(stylingState.strokeStyle);
      game.setTextColor(stylingState.textColor);
      game.setDesignColor(stylingState.designColor);

      if (stylingState.gradientType !== "none") {
        game.setGradient({
          type: stylingState.gradientType,
          colors: stylingState.gradientColors,
          stops: [0, 1],
          angle: 45
        });
      } else {
        game.setGradient(undefined);
      }
    }
  }, [game, stylingState]);

  const getCurrentColor = () => {
    switch (stylingState.selectedColorType) {
      case 'stroke': return stylingState.strokeColor;
      case 'fill': return stylingState.fillColor;
      case 'text': return stylingState.textColor;
      default: return stylingState.strokeColor;
    }
  };

  const setCurrentColor = (color: string) => {
    switch (stylingState.selectedColorType) {
      case 'stroke':
        setStylingState(prev => ({ ...prev, strokeColor: color }));
        break;
      case 'fill':
        setStylingState(prev => ({ ...prev, fillColor: color }));
        break;
      case 'text':
        setStylingState(prev => ({ ...prev, textColor: color }));
        break;
    }
  };

  const getCurrentColorPalette = () => {
    switch (stylingState.selectedColorType) {
      case 'stroke':
        return [
          '#1976D2', '#1565C0', '#0D47A1', '#1E88E5', '#2196F3', '#42A5F5',
          '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD', '#00BCD4', '#00ACC1',
          '#2E7D32', '#388E3C', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',
          '#F57C00', '#FF9800', '#FFA726', '#FFB74D', '#FFCC80', '#FFE0B2',
          '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8',
          '#D32F2F', '#E53935', '#F44336', '#EF5350', '#E57373', '#FFCDD2'
        ];
      case 'fill':
        return [
          '#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3',
          '#1E88E5', '#1976D2', '#1565C0', '#0D47A1', '#E1F5FE', '#B3E5FC',
          '#81D4FA', '#4FC3F7', '#29B6F6', '#03A9F4', '#00BCD4', '#00ACC1',
          '#E8F5E8', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50',
          '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800',
          '#FCE4EC', '#F8BBD9', '#F48FB1', '#F06292', '#EC407A', '#E91E63',
          '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0'
        ];
      case 'text':
        return [
          '#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5',
          '#64B5F6', '#90CAF9', '#BBDEFB', '#E3F2FD', '#000000', '#424242',
          '#616161', '#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0', '#F5F5F5',
          '#2E7D32', '#388E3C', '#4CAF50', '#66BB6A', '#81C784', '#A5D6A7',
          '#D84315', '#E64A19', '#F4511E', '#FF5722', '#FF7043', '#FF8A65',
          '#6A1B9A', '#7B1FA2', '#8E24AA', '#9C27B0', '#AB47BC', '#BA68C8',
          '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6'
        ];
      default:
        return [];
    }
  };

  const setSelectedColorType = (type: 'stroke' | 'fill' | 'text') => {
    setStylingState(prev => ({ ...prev, selectedColorType: type }));
  };

  const setFillColor = (color: string) => {
    setStylingState(prev => ({ ...prev, fillColor: color }));
  };

  const setStrokeColor = (color: string) => {
    setStylingState(prev => ({ ...prev, strokeColor: color }));
  };

  const setStrokeWidth = (width: number) => {
    setStylingState(prev => ({ ...prev, strokeWidth: width }));
  };

  const setOpacity = (opacity: number) => {
    setStylingState(prev => ({ ...prev, opacity }));
  };

  const setStrokeStyle = (style: StrokePattern) => {
    setStylingState(prev => ({ ...prev, strokeStyle: style }));
  };

  const setGradientType = (type: GradientType) => {
    setStylingState(prev => ({ ...prev, gradientType: type }));
  };

  const setGradientColors = (colors: string[]) => {
    setStylingState(prev => ({ ...prev, gradientColors: colors }));
  };

  const setTextColor = (color: string) => {
    setStylingState(prev => ({ ...prev, textColor: color }));
  };

  const setDesignColor = (color: string) => {
    setStylingState(prev => ({ ...prev, designColor: color }));
  };

  return {
    stylingState,
    getCurrentColor,
    setCurrentColor,
    getCurrentColorPalette,
    setSelectedColorType,
    setFillColor,
    setStrokeColor,
    setStrokeWidth,
    setOpacity,
    setStrokeStyle,
    setGradientType,
    setGradientColors,
    setTextColor,
    setDesignColor
  };
}
