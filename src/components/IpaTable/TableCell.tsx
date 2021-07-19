import { FC, useContext } from 'react';

import {
  TableContext, applyDiacriticsToSound, canApplyDiacriticsToSound, allFeatures,
} from '../../assets/ipa-data';
import { Diacritic, Sound } from '../../lib/types';

function sortSounds(a, b) {
  // eslint-disable-next-line no-restricted-syntax
  for (const [feature] of allFeatures) {
    if (a[feature] !== b[feature]) {
      if (a[feature] === true) return 1;
      if (a[feature] === false) return -1;
    }
  }
  return 1;
}

type TableCellProps = {
  sounds: Sound[];
  insertBelow?: (toAdd: Diacritic) => void;
  editable: boolean;
};

type SoundContainerProps = { sound: Sound };

export default function TableCell({
  sounds, insertBelow, editable,
}: TableCellProps) {
  const {
    setAllSounds,
    selectedSounds, setSelectedSounds: setSounds,
    neighbor, setNeighbor,
    selectedDiacritics, setSelectedDiacritics,
  } = useContext(TableContext);

  const baseStyles = 'px-1 lg:py-1 w-8 focus:outline-none font-serif text-center';
  let SoundContainer: FC<SoundContainerProps>;

  if (!editable) {
    SoundContainer = ({ sound }: SoundContainerProps) => (
      <div className={baseStyles}>{sound.symbol}</div>
    );
  } else if (selectedDiacritics.length > 0) {
    SoundContainer = ({ sound }: SoundContainerProps) => (
      <button
        type="button"
        className={`${baseStyles} ${canApplyDiacriticsToSound(selectedDiacritics, sound.features) ? 'bg-blue-300 hover:bg-green-300' : 'bg-yellow-300 hover:bg-yellow-500'}`}
        onClick={() => {
          setSelectedDiacritics([]);

          if (canApplyDiacriticsToSound(selectedDiacritics, sound.features)) {
            setAllSounds((prev) => [...prev, applyDiacriticsToSound(sound, ...selectedDiacritics)]);
            insertBelow(selectedDiacritics[0]);
          }
        }}
      >
        {sound.symbol}
      </button>
    );
  } else {
    SoundContainer = ({ sound }: SoundContainerProps) => (
      <button
        type="button"
        className={`${baseStyles} ${selectedSounds.some((s) => s.symbol === sound.symbol)
          ? 'bg-green-300 hover:bg-red-500' : 'hover-blue'}`}
        onClick={(e) => {
          // shift key: toggle neighbor
          // alt key: remove from all sounds
          // regular click: toggle sound selected
          if (e.shiftKey) {
            if (sound === neighbor) setNeighbor(null);
            else setNeighbor(sound);
          } else if (e.altKey) {
            setAllSounds((prev) => prev.filter((s) => s.symbol !== sound.symbol));
          } else {
            setSounds((prev: Sound[]) => (
              prev.includes(sound)
                ? prev.filter((s) => s.symbol !== sound.symbol) : [...prev, sound]
            ));
          }
        }}
      >
        {sound.symbol}
      </button>
    );
  }

  return (
    <td className="border-gray">
      <div className="flex h-full w-full items-center justify-around">
        {/* unvoiced on left, voiced on right */}
        {[...sounds].sort(sortSounds).map((sound) => (
          // eslint-disable-next-line react/prop-types
          <SoundContainer key={sound.symbol} sound={sound} />
        ))}
      </div>
    </td>
  );
}
