import { ImageSourcePropType } from 'react-native';

export const BASE_CHARACTER_IMAGES = {
  bee: require('../assets/character/base_bee.png'),
  bee_clean_props: require('../assets/character/base_bee_clean_props.png'),
  wizard_girl: require('../assets/character/char_wizard_girl.png'),
  detective_boy: require('../assets/character/char_detective_boy.png'),
  master_bee_stage: require('../assets/character/master_bee_stage.png'),
} as const;

export const HAT_IMAGES = {
  wizard_hat: require('../assets/character/hat_wizard.png'),
  detective_fedora: require('../assets/character/hat_fedora.png'),
  gold_crown: require('../assets/character/hat_crown.png'),
  flower_crown: require('../assets/character/hat_flower.png'),
  grad_cap: require('../assets/character/hat_grad.png'),
} as const;

export const EYEWEAR_IMAGES = {
  round_glasses: require('../assets/character/eyewear_glasses.png'),
} as const;

export const OUTFIT_IMAGES = {
  satchel: require('../assets/character/outfit_satchel.png'),
  bowtie: require('../assets/character/outfit_bowtie.png'),
  red_cape: require('../assets/character/outfit_red_cape.png'),
  detective_vest: require('../assets/character/outfit_vest.png'),
  master_cape: require('../assets/character/outfit_master_cape.png'),
} as const;

export const PROP_IMAGES = {
  magnifier: require('../assets/character/prop_magnifier.png'),
  spelling_tome: require('../assets/character/prop_tome.png'),
  star_wand: require('../assets/character/prop_wand.png'),
  open_tome: require('../assets/character/prop_open_tome.png'),
} as const;

export const SHOP_ITEM_THUMBNAILS: Record<string, ImageSourcePropType> = {
  'char:bee': BASE_CHARACTER_IMAGES.bee,
  'char:wizard_girl': BASE_CHARACTER_IMAGES.wizard_girl,
  'char:detective_boy': BASE_CHARACTER_IMAGES.detective_boy,

  'hat:wizard_hat': HAT_IMAGES.wizard_hat,
  'hat:detective_fedora': HAT_IMAGES.detective_fedora,
  'hat:gold_crown': HAT_IMAGES.gold_crown,
  'hat:flower_crown': HAT_IMAGES.flower_crown,
  'hat:grad_cap': HAT_IMAGES.grad_cap,

  'eyewear:round_glasses': EYEWEAR_IMAGES.round_glasses,

  'outfit:satchel': OUTFIT_IMAGES.satchel,
  'outfit:bowtie': OUTFIT_IMAGES.bowtie,
  'outfit:red_cape': OUTFIT_IMAGES.red_cape,
  'outfit:detective_vest': OUTFIT_IMAGES.detective_vest,
  'outfit:master_cape': OUTFIT_IMAGES.master_cape,

  'prop:magnifier': PROP_IMAGES.magnifier,
  'prop:spelling_tome': PROP_IMAGES.spelling_tome,
  'prop:star_wand': PROP_IMAGES.star_wand,
  'prop:wand_tome': PROP_IMAGES.open_tome,
};
