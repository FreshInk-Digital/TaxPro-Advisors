import type { Schema, Struct } from '@strapi/strapi';

export interface CommonButtonLink extends Struct.ComponentSchema {
  collectionName: 'components_common_button_links';
  info: {
    displayName: 'button-link';
  };
  attributes: {
    label: Schema.Attribute.String;
    openInNewTab: Schema.Attribute.Boolean;
    url: Schema.Attribute.String;
  };
}

export interface HeroSlider extends Struct.ComponentSchema {
  collectionName: 'components_hero_sliders';
  info: {
    displayName: 'slider';
  };
  attributes: {
    image: Schema.Attribute.Media<
      'images' | 'files' | 'videos' | 'audios',
      true
    >;
  };
}

export interface HomeStats extends Struct.ComponentSchema {
  collectionName: 'components_home_stats';
  info: {
    displayName: 'Stats';
  };
  attributes: {
    iconKey: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    label: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface ServiceFeatures extends Struct.ComponentSchema {
  collectionName: 'components_service_features';
  info: {
    displayName: 'features';
  };
  attributes: {
    label: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'common.button-link': CommonButtonLink;
      'hero.slider': HeroSlider;
      'home.stats': HomeStats;
      'service.features': ServiceFeatures;
    }
  }
}
