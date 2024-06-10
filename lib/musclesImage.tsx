import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

const MusclesImage = ({ selectedPrimary, selectedSecondary }) => {
  const getMuscleColor = (muscleName) => {
    if (selectedPrimary.includes(muscleName)) {
      return 'red';
    }
    if (selectedSecondary.includes(muscleName)) {
      return 'yellow';
    }
    return 'transparent';
  };

  return (
   <Svg/>
  )
}

export default MusclesImage;