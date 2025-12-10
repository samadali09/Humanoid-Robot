import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Advanced AI Core',
    // Note: Aapko apni robot brain ki image yahan lagani hogi
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Powered by state-of-the-art neural networks. The robot can process visual 
        data, recognize faces, and adapt to dynamic environments in real-time.
      </>
    ),
  },
  {
    title: 'Fluid Humanoid Motion',
    // Note: Aapko robot walking/structure ki image yahan lagani hogi
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Engineered with 34 degrees of freedom. Our actuators allow for seamless, 
        natural walking, running, and precise hand gestures similar to humans.
      </>
    ),
  },
  {
    title: 'Human-Robot Interaction',
    // Note: Aapko interaction/speech ki image yahan lagani hogi
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Designed for safe collaboration. With Natural Language Processing (NLP), 
        the robot understands voice commands and responds with emotional intelligence.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}