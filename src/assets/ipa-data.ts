import { NextApiRequest } from 'next';
import { createContext, Dispatch, SetStateAction } from 'react';
import featureData from './feature-data.json';
import rawSounds from './base-features.json';
import rawDiacritics from './diacritics.json';
import { Sound } from '../models/Sound';

export type Condition = Partial<Sound> | ((_: Sound) => boolean) | Condition[];

export type FeatureSet = {
  name: string;
  features: Condition;
};
export type Manner = FeatureSet;
export type Place = FeatureSet;
export type Frontness = FeatureSet;
export type Height = FeatureSet;
export type Diacritic = FeatureSet & {
  symbol: string;
  requirements: Partial<Sound>;
  createNewRow: boolean;
};

export type SoundHook = Dispatch<SetStateAction<Sound[]>>;

export type CustomRequest = NextApiRequest & { session: any };

export type UserPayload = {
  error?: { message: string };
  username?: string;
  charts: {
    name: string,
    sounds: Sound[]
  }[];
};

// the two features missing from the original book are
// implosive and ATR (equivalent to tense in some languages)
export const allSounds = rawSounds as Sound[];
export const allManners = featureData.manners as Manner[];
export const allPlaces = featureData.places as Place[];

function matchConditions(sound: Sound, condition: Condition) {
  if (Array.isArray(condition)) return condition.every((c) => matchConditions(sound, c));

  if (typeof condition === 'object') {
    // check for array
    return Object.keys(condition)
      .filter((key) => key !== 'name')
      .every((key) => (Array.isArray(condition[key])
        ? condition[key].includes(sound[key])
        : sound[key] === condition[key]));
  }

  if (typeof condition === 'function') return condition(sound);

  return true;
}

export function matchFeatures(sounds: Sound[], ...conditions: Condition[]) {
  return sounds.filter(
    (sound) => matchConditions(sound, conditions),
  );
}

const featureInverseMap = new Map<boolean | 0, [boolean | 0, boolean | 0]>([
  [0, [true, false]],
  [true, [false, 0]],
  [false, [0, true]],
]);

export function invertFeatures(features: Partial<Sound>) {
  return Object.keys(features).reduce(
    (prev, key) => ({
      ...prev,
      [key]: featureInverseMap.get(features[key]),
    }),
    {},
  );
}

// all of the optional fields are for the FilterFeature component to work properly
export type TableContextType = {
  allSounds?: Sound[];
  setAllSounds?: SoundHook;
  selectedSounds: Sound[];
  setSelectedSounds?: SoundHook;
  neighbor?: Sound | null;
  setNeighbor?: Dispatch<SetStateAction<Sound | null>>;
  selectedDiacritics: Diacritic[] | null;
  setSelectedDiacritics: Dispatch<SetStateAction<Diacritic[]>>;
  handleDiacriticClick: (diacritic: Diacritic) => void;
  deleteFeatureSet?: (featureSet: FeatureSet) => void;
};

export const TableContext = createContext<TableContextType>({
  allSounds: [],
  setAllSounds: () => {},
  selectedSounds: [],
  setSelectedSounds: () => {},
  neighbor: null,
  setNeighbor: () => {},
  selectedDiacritics: null,
  setSelectedDiacritics: () => {},
  handleDiacriticClick: () => {},
  deleteFeatureSet: () => {},
});

export const allFeatures: [keyof Sound, string, string][] = [
  ['symbol', 'symbol', 'the IPA character for this segment'],

  ['syllabic', 'manner', 'can occur as syllable nucleus; typically [+syllabic] consists of vowels'],
  ['consonantal', 'manner', 'see sonority hierarchy'],
  ['approximant', 'manner', 'see sonority hierarchy'],
  ['sonorant', 'manner', 'see sonority hierarchy'],
  ['continuant', 'manner', 'see sonority hierarchy; [-continuant] full closure of oral cavity'],
  ['delayed release', 'manner', 'see sonority hierarchy; includes frication (hissing) noise'],
  ['nasal', 'manner', 'air escapes through the nose'],
  ['tap', 'manner', 'motion where one articulator is thrown against another'],
  ['trill', 'manner', 'vibration between the active and passive articulator'],

  ['voice', 'laryngeal', 'vocal chord vibration'],
  ['spread gl', 'laryngeal', 'vocal chords far apart, producing wide glottis'],
  ['constr gl', 'laryngeal', 'vocal chords close together, producing narrow or closed glottis'],

  ['labial', 'place', 'articulated with the lips'],
  ['round', 'place', 'rounded lips'],
  ['labiodental', 'place', 'touching lower lip to upper teeth'],

  ['coronal', 'place', 'articulated with the tip/blade of the tongue'],
  ['anterior', 'place', 'at the alveolar ridge or forward'],
  ['distributed', 'place', 'laminals (tongue blade) are [+distributed], apicals (tongue tip) are [-distributed]'],
  ['strident', 'place', 'airstream channelled through groove and blown at the teeth; [+strident] aka sibilant'],
  ['lateral', 'place', 'tongue compressed horizontally to allow airflow through sides'],
  ['dorsal', 'place', 'articulated with the body of the tongue'],

  ['high', 'dorsal', 'tongue body high in the mouth'],
  ['low', 'dorsal', 'tongue body low in the mouth'],
  ['front', 'dorsal', 'tongue body in the front of the mouth'],
  ['back', 'dorsal', 'tongue body in back of the mouth'],
  ['tense', 'dorsal', 'finer distinction of height; [-tense] aka lax'],

  ['stress', 'prosody', 'emphasized sound'],
  ['long', 'prosody', 'increased duration of vowel or consonant'],
];

export const allDiacritics: Diacritic[] = rawDiacritics;

export const allFrontnesses = [
  { name: 'front unrounded', features: { round: false, front: true, back: false } },
  { name: 'front rounded', features: { round: true, front: true, back: false } },
  { name: 'central unrounded', features: { round: false, front: false, back: false } },
  { name: 'central rounded', features: { round: true, front: false, back: false } },
  { name: 'back unrounded', features: { round: false, front: false, back: true } },
  { name: 'back rounded', features: { round: true, front: false, back: true } },
];

export const allHeights: Height[] = [
  { name: 'close', features: { high: true, low: false, tense: true } },
  { name: 'near-close', features: { high: true, low: false, tense: false } },
  { name: 'mid', features: { high: false, low: false, tense: true } },
  { name: 'near-open', features: { high: false, low: false, tense: false } },
  { name: 'open', features: { high: false, low: true } },
];

// arr is a list of all e.g. places, manners, heights, frontnesses
// get all elements of arr which contain sounds
export function filterNonEmpty(sounds: Sound[], arr: FeatureSet[], ...conditions: Condition[]) {
  return arr.filter(
    ({ features }) => matchFeatures(sounds, features, ...conditions).length > 0,
  );
}

export function toggleInArray<T>(array: T[], element: T) {
  return array.includes(element) ? array.filter((e) => e !== element) : [...array, element];
}

export function canApplyDiacriticsToSound(diacritics: Diacritic[], sound: Sound) {
  // can't apply diacritics if they have no effect
  return diacritics.every((diacritic) => matchFeatures([sound], diacritic.requirements).length > 0
          && matchFeatures([sound], diacritic.features).length === 0);
}

export function applyDiacriticsToSound(sound: Sound, ...diacritics: Diacritic[]) {
  const newSound: Sound = { ...sound };
  diacritics.forEach((diacritic) => {
    newSound.symbol += diacritic.symbol;
    Object.keys(diacritic.features).forEach((feature) => {
      newSound[feature] = diacritic.features[feature];
    });
  });
  return newSound;
}
