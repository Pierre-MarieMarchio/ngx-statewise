import type { LocaleCode } from '../i18n';

/** A value the landing page must have in every locale. */
type Translated = Record<LocaleCode, string>;

export interface ComparisonRow {
  readonly axis: Translated;
  readonly byHand: Translated;
  readonly withLibrary: Translated;
}

/**
 * What the library replaces, compared against writing the same thing with
 * plain services — not against another library. The comparison that matters to
 * someone arriving here is with what they are doing now.
 */
export const COMPARISON: readonly ComparisonRow[] = [
  {
    axis: {
      en: 'Where the state lives',
      fr: 'Où vit l’état',
      es: 'Dónde vive el estado',
      de: 'Wo der State liegt',
      'pt-BR': 'Onde o estado mora',
    },
    byHand: {
      en: 'A service, holding whatever fields it needs.',
      fr: 'Un service, avec les champs dont il a besoin.',
      es: 'Un servicio, con los campos que necesite.',
      de: 'Ein Service mit den Feldern, die er eben braucht.',
      'pt-BR': 'Um serviço, com os campos de que precisar.',
    },
    withLibrary: {
      en: 'The same service — and an updater is the only thing allowed to write to it.',
      fr: 'Le même service — et un updater est seul autorisé à y écrire.',
      es: 'El mismo servicio, y un updater es lo único con permiso para escribir en él.',
      de: 'Derselbe Service — und nur ein Updater darf hineinschreiben.',
      'pt-BR':
        'O mesmo serviço — e um updater é a única coisa autorizada a escrever nele.',
    },
  },
  {
    axis: {
      en: 'What starts a change',
      fr: 'Ce qui déclenche un changement',
      es: 'Qué inicia un cambio',
      de: 'Was eine Änderung auslöst',
      'pt-BR': 'O que inicia uma mudança',
    },
    byHand: {
      en: 'A method call, from wherever happens to call it.',
      fr: 'Un appel de méthode, depuis n’importe où.',
      es: 'Una llamada a un método, desde donde sea que la haga.',
      de: 'Ein Methodenaufruf, von wo auch immer er kommt.',
      'pt-BR': 'Uma chamada de método, de onde quer que ela venha.',
    },
    withLibrary: {
      en: 'A dispatched action. Nothing else can start a flow.',
      fr: 'Une action dispatchée. Rien d’autre ne peut lancer un flux.',
      es: 'Una action despachada. Nada más puede iniciar un flujo.',
      de: 'Eine dispatchte Action. Nichts sonst kann einen Ablauf starten.',
      'pt-BR': 'Uma action despachada. Nada mais pode iniciar um fluxo.',
    },
  },
  {
    axis: {
      en: 'The order things run in',
      fr: 'L’ordre d’exécution',
      es: 'El orden de ejecución',
      de: 'Die Reihenfolge der Ausführung',
      'pt-BR': 'A ordem de execução',
    },
    byHand: {
      en: 'Whatever the method body does, in the order it was typed.',
      fr: 'Ce que fait le corps de la méthode, dans l’ordre où il a été écrit.',
      es: 'Lo que haga el cuerpo del método, en el orden en que se escribió.',
      de: 'Was der Methodenrumpf tut, in der Reihenfolge, in der er getippt wurde.',
      'pt-BR': 'O que o corpo do método fizer, na ordem em que foi digitado.',
    },
    withLibrary: {
      en: 'Always the same: the state is written, then the side work runs.',
      fr: 'Toujours le même : l’état est écrit, puis le travail annexe part.',
      es: 'Siempre el mismo: se escribe el estado y luego arranca el trabajo asíncrono.',
      de: 'Immer dieselbe: erst wird der State geschrieben, dann läuft die Nebenarbeit.',
      'pt-BR':
        'Sempre a mesma: o estado é escrito, depois o trabalho paralelo roda.',
    },
  },
  {
    axis: {
      en: 'Two features on one event',
      fr: 'Deux fonctionnalités sur un même événement',
      es: 'Dos funcionalidades sobre un mismo evento',
      de: 'Zwei Features auf einem Ereignis',
      'pt-BR': 'Duas funcionalidades no mesmo evento',
    },
    byHand: {
      en: 'The caller has to know about both, and call them in the right order.',
      fr: 'L’appelant doit connaître les deux, et les appeler dans le bon ordre.',
      es: 'Quien llama debe conocer las dos y llamarlas en el orden correcto.',
      de: 'Der Aufrufer muss beide kennen und in der richtigen Reihenfolge aufrufen.',
      'pt-BR':
        'Quem chama precisa conhecer as duas e chamá-las na ordem certa.',
    },
    withLibrary: {
      en: 'Each declares a handler for the same action, and neither knows the other.',
      fr: 'Chacune déclare un handler pour la même action, sans connaître l’autre.',
      es: 'Cada una declara un handler para la misma action, sin conocer a la otra.',
      de: 'Jedes deklariert einen Handler für dieselbe Action, ohne vom anderen zu wissen.',
      'pt-BR':
        'Cada uma declara um handler para a mesma action, sem conhecer a outra.',
    },
  },
];

/**
 * The three cases the guide's "When it does not" section names, said shorter.
 * Kept on the landing page on purpose: a reader deciding is better served by
 * finding this here than four clicks in.
 */
export const NOT_FOR: readonly Translated[] = [
  {
    en: 'You need one serialisable state tree, for time-travel debugging or for replaying a session. State here is spread across injectables.',
    fr: 'Vous avez besoin d’un arbre d’état sérialisable, pour du time-travel ou pour rejouer une session. Ici l’état est réparti dans des injectables.',
    es: 'Necesitas un único árbol de estado serializable, para depurar viajando en el tiempo o para reproducir una sesión. Aquí el estado está repartido entre inyectables.',
    de: 'Du brauchst einen einzigen serialisierbaren State-Baum, für Time-Travel-Debugging oder um eine Sitzung abzuspielen. Hier liegt der State verteilt in Injectables.',
    'pt-BR':
      'Você precisa de uma única árvore de estado serializável, para depurar voltando no tempo ou para repetir uma sessão. Aqui o estado fica espalhado em injetáveis.',
  },
  {
    en: 'You compose derived state heavily. `computed` covers a lot, but there is no selector layer with memoisation and parameters.',
    fr: 'Vous composez beaucoup d’état dérivé. `computed` couvre beaucoup, mais il n’y a pas de couche de sélecteurs mémoïsés et paramétrables.',
    es: 'Compones mucho estado derivado. `computed` cubre bastante, pero no hay una capa de selectores con memoización ni parámetros.',
    de: 'Du komponierst viel abgeleiteten State. `computed` deckt vieles ab, aber es gibt keine Selector-Schicht mit Memoisierung und Parametern.',
    'pt-BR':
      'Você compõe muito estado derivado. `computed` cobre bastante, mas não há camada de seletores com memoização e parâmetros.',
  },
  {
    en: 'Your state is driven by streams rather than by intent. If websockets move your data more than your users do, an Observable-first library suits you better.',
    fr: 'Votre état est piloté par des flux plutôt que par l’intention. Si des websockets font bouger vos données plus que vos utilisateurs, une librairie orientée Observable vous ira mieux.',
    es: 'Tu estado lo mueven los flujos más que la intención. Si los websockets cambian tus datos más que tus usuarios, te conviene una librería orientada a Observables.',
    de: 'Dein State wird von Streams getrieben, nicht von Absicht. Wenn Websockets deine Daten mehr bewegen als deine Nutzer, passt eine Observable-orientierte Bibliothek besser.',
    'pt-BR':
      'Seu estado é movido por streams e não por intenção. Se websockets mexem nos seus dados mais que seus usuários, uma biblioteca orientada a Observable serve melhor.',
  },
];

export interface Door {
  readonly title: Translated;
  readonly text: Translated;
  /** A guide slug, or an absolute URL when it leaves the site. */
  readonly slug?: string;
  readonly href?: string;
}

/** The three ways in, so a reader picks one instead of scrolling. */
export const DOORS: readonly Door[] = [
  {
    title: {
      en: 'Install it',
      fr: 'L’installer',
      es: 'Instalarlo',
      de: 'Installieren',
      'pt-BR': 'Instalar',
    },
    text: {
      en: 'One package, one provider, and you are dispatching.',
      fr: 'Un paquet, un provider, et vous dispatchez.',
      es: 'Un paquete, un provider, y ya estás despachando.',
      de: 'Ein Paket, ein Provider, und du dispatchst.',
      'pt-BR': 'Um pacote, um provider, e você já está despachando.',
    },
    slug: 'getting-started',
  },
  {
    title: {
      en: 'Understand the flow',
      fr: 'Comprendre le flux',
      es: 'Entender el flujo',
      de: 'Den Ablauf verstehen',
      'pt-BR': 'Entender o fluxo',
    },
    text: {
      en: 'The five steps every change goes through, and the two consequences.',
      fr: 'Les cinq étapes de chaque changement, et les deux conséquences.',
      es: 'Los cinco pasos por los que pasa cada cambio, y las dos consecuencias.',
      de: 'Die fünf Schritte, die jede Änderung durchläuft, und die zwei Folgen.',
      'pt-BR':
        'Os cinco passos por que passa cada mudança, e as duas consequências.',
    },
    slug: 'introduction',
  },
  {
    title: {
      en: 'Read real code',
      fr: 'Lire du vrai code',
      es: 'Leer código real',
      de: 'Echten Code lesen',
      'pt-BR': 'Ler código real',
    },
    text: {
      en: 'The showcase application, wired with the library, on GitHub.',
      fr: 'L’application de démonstration, câblée avec la librairie, sur GitHub.',
      es: 'La aplicación de demostración, cableada con la librería, en GitHub.',
      de: 'Die Showcase-Anwendung, mit der Bibliothek verdrahtet, auf GitHub.',
      'pt-BR': 'A aplicação de demonstração, ligada à biblioteca, no GitHub.',
    },
    href: 'https://github.com/Pierre-MarieMarchio/ngx-statewise/tree/main/projects/ngx-statewise-showcase',
  },
];
