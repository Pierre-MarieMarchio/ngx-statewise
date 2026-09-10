# Traductions françaises du guide

Le corps des pages reste en anglais. Ce dossier existe pour le jour où une page
serait traduite, et rien n'y est traduit aujourd'hui.

Pour traduire une page, copiez-la depuis `../en/` sous le même nom, gardez le
corps seul — pas de bloc de métadonnées, il est déclaré une fois dans la page
anglaise — puis donnez au registre la forme objet dans
`../../guide-pages.ts` :

```typescript
{ source: effectsEn, translations: { fr: effectsFr } }
```

Tant qu'une page n'a pas de version française, le site sert l'anglais et
affiche un bandeau le disant.
