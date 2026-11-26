import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, Image, Linking, Modal, Platform, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FEED_URL, ORIGIN, canonicalUrl, deepLinkUrl, enquiryUrl, entryKey, filterEntries, formatDate, parseCatalogue, reconcileSaved } from './domain';
import StaffWorkspace from './StaffWorkspace';
import SecureWebsite from './SecureWebsite';
import type { Catalogue, Entry, SavedEntry } from './domain';
import { clearPublicCache, readCache, readSaved, writeCache, writeSaved } from './storage';

const colors = { ink: '#292821', gold: '#8a7333', pale: '#efe9d9', paper: '#faf9f5', muted: '#65645c', border: '#dedacf', white: '#ffffff' };
const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });
type Icon = React.ComponentProps<typeof Ionicons>['name'];
type Tab = 'Home' | 'Explore' | 'HORECA' | 'Saved' | 'More';
const tabs: { label: Tab; icon: Icon; selected: Icon }[] = [
  { label: 'Home', icon: 'home-outline', selected: 'home' }, { label: 'Explore', icon: 'compass-outline', selected: 'compass' },
  { label: 'HORECA', icon: 'restaurant-outline', selected: 'restaurant' }, { label: 'Saved', icon: 'bookmark-outline', selected: 'bookmark' }, { label: 'More', icon: 'grid-outline', selected: 'grid' },
];

async function openWebsite(href: string): Promise<void> {
  const url = canonicalUrl(href);
  if (!url) { Alert.alert('Link unavailable', 'Please explore this item on indiagully.com.'); return; }
  try { await WebBrowser.openBrowserAsync(url, { toolbarColor: colors.ink, controlsColor: '#e5d7a8', presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET }); }
  catch { Alert.alert('Could not open the website', 'Please try again when your connection is available.'); }
}
function IconButton({ name, label, onPress, light = false }: { name: Icon; label: string; onPress: () => void; light?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}><Ionicons name={name} size={24} color={light ? colors.white : colors.ink} /></Pressable>;
}
function Button({ label, onPress, secondary = false, icon = 'arrow-forward' }: { label: string; onPress: () => void; secondary?: boolean; icon?: Icon }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondaryButton, pressed && styles.pressed]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text><Ionicons name={icon} size={19} color={secondary ? colors.ink : colors.white} /></Pressable>;
}
function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text></Pressable>;
}
function Photo({ uri, alt, style, fit = 'cover' }: { uri: string | null; alt: string; style?: object; fit?: 'cover' | 'contain' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  if (!uri || failed) return <View accessibilityLabel="Image unavailable" style={[styles.photo, styles.photoEmpty, style]}><Image source={require('../assets/brand-mark.png')} style={styles.photoMark} resizeMode="contain" /><Text style={styles.photoEmptyText}>INDIA GULLY</Text></View>;
  return <Image accessibilityLabel={alt} source={{ uri }} onError={() => setFailed(true)} style={[styles.photo, fit === 'contain' && { backgroundColor: colors.white }, style]} resizeMode={fit} />;
}
function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) { return <Text style={[styles.eyebrow, light && { color: '#e1d5af' }]}>{children}</Text>; }
function Heading({ title, subtitle, action, onPress }: { title: string; subtitle?: string; action?: string; onPress?: () => void }) {
  return <View style={styles.heading}><View style={{ flex: 1 }}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>{subtitle && <Text style={styles.secondary}>{subtitle}</Text>}</View>{action && <Pressable onPress={onPress} accessibilityRole="button" style={styles.textAction}><Text style={styles.textActionText}>{action} →</Text></Pressable>}</View>;
}
function Empty({ title, text, icon = 'search-outline', action, onPress }: { title: string; text: string; icon?: Icon; action?: string; onPress?: () => void }) {
  return <View style={styles.empty}><Ionicons name={icon} size={32} color={colors.gold} /><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyText}>{text}</Text>{action && onPress && <Button label={action} onPress={onPress} secondary />}</View>;
}
function labelFor(entry: Entry): string { return entry.type === 'product' ? entry.category || 'HORECA' : entry.type === 'perspective' ? 'Perspective' : entry.type === 'practice' ? 'Our practice' : entry.kind === 'brand' ? 'Brand requirement' : entry.kind === 'promoter' ? 'Space for lease' : 'Investment opportunity'; }
function Card({ entry, saved, onOpen, onSave }: { entry: Entry; saved: boolean; onOpen: () => void; onSave: () => void }) {
  return <View style={styles.card}><Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Explore ${entry.title}`}>
    <Photo uri={entry.image} alt={entry.image_alt || entry.title} fit={entry.type === 'product' ? 'contain' : 'cover'} />
    <View style={styles.cardBody}><Eyebrow>{labelFor(entry)}</Eyebrow>{entry.type==='listing'&&!!entry.listing_status_text&&<Text style={styles.listingStatus}>{entry.listing_status_text}</Text>}<Text style={styles.cardTitle}>{entry.title}</Text>
      {!!entry.city && <Text style={styles.location}>{[entry.city, entry.region].filter(Boolean).join(', ')}</Text>}
      {!!entry.summary && <Text numberOfLines={3} style={styles.cardSummary}>{entry.summary}</Text>}
      {!!entry.sku && <Text style={styles.meta}>SKU {entry.sku}{entry.brand ? ` · ${entry.brand}` : ''}</Text>}
      {!!entry.tags.length && <View style={styles.tagRow}>{entry.tags.slice(0, 4).map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View>}
      <Text style={styles.exploreLink}>Explore details ↗</Text>
    </View>
  </Pressable><View style={styles.cardSave}><IconButton name={saved ? 'bookmark' : 'bookmark-outline'} label={`${saved ? 'Remove' : 'Save'} ${entry.title}${saved ? ' from' : ' to'} shortlist`} onPress={onSave} /></View></View>;
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('Home');
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [saved, setSaved] = useState<SavedEntry[]>([]);
  const savedRef = useRef(saved);
  const hydrated = useRef(false);
  const savedReadable = useRef(false);
  const [savedError, setSavedError] = useState(false);
  const savedQueue = useRef<Promise<void>>(Promise.resolve());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [notice, setNotice] = useState('');
  const [selected, setSelected] = useState<Entry | null>(null);
  const [staffOpen, setStaffOpen] = useState(false);
  const [publicWebsite, setPublicWebsite] = useState<'client' | 'careers' | null>(null);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState('all');
  const [city, setCity] = useState('all');
  const [productQuery, setProductQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [productLimit, setProductLimit] = useState(24);
  useEffect(() => setProductLimit(24), [category, productQuery, catalogue]);
  const [moreSection, setMoreSection] = useState<'menu' | 'perspectives' | 'practices'>('menu');
  const [pendingLink, setPendingLink] = useState<string | null>(null);
  const busy = useRef(false);
  const scroll = useRef<React.ElementRef<typeof ScrollView>>(null);
  const request = useRef<AbortController | null>(null);
  const setSavedState = (value: SavedEntry[]) => { savedRef.current = value; setSaved(value); };
  const mutateSaved = useCallback((update: (current: SavedEntry[]) => SavedEntry[]) => {
    const task = savedQueue.current.then(async () => {
      if (!savedReadable.current) throw new Error('Shortlist must be loaded before saving');
      const next = update(savedRef.current);
      await writeSaved(next);
      setSavedState(next);
    });
    savedQueue.current = task.catch(() => {});
    return task;
  }, []);

  const refresh = useCallback(async () => {
    if (busy.current || !hydrated.current) return;
    busy.current = true; setRefreshing(true);
    const controller = new AbortController(); request.current = controller;
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(FEED_URL, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('unavailable');
      const raw = await response.text(); if (raw.length > 8_000_000) throw new Error('oversized');
      const feed = parseCatalogue(JSON.parse(raw));
      setCatalogue(feed); setNotice('');
      setSelected(previous => previous ? [...feed.listings, ...feed.products, ...feed.perspectives, ...feed.practices].find(entry => entryKey(entry) === entryKey(previous)) || null : null);
      const persisted = await Promise.allSettled([writeCache(feed), ...(savedReadable.current ? [mutateSaved(current => reconcileSaved(current, feed))] : [])]);
      if (persisted.some(result => result.status === 'rejected')) {
        if (savedReadable.current) setSavedState(reconcileSaved(savedRef.current, feed));
        setNotice('Your catalogue is current, but this device could not save an offline copy.');
      }
      setFresh(true);
    } catch { setFresh(false); setNotice('We could not refresh the catalogue. Check your connection and try again.'); }
    finally { clearTimeout(timer); busy.current = false; setLoading(false); setRefreshing(false); }
  }, [mutateSaved]);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [cache, shortlist] = await Promise.allSettled([readCache(), readSaved()]);
      if (!mounted) return;
      setCatalogue(cache.status === 'fulfilled' ? cache.value : null);
      if (shortlist.status === 'fulfilled') { setSavedState(shortlist.value); savedReadable.current = true; }
      else setSavedError(true);
      hydrated.current = true;
      await refresh();
    })();
    return () => { mounted = false; request.current?.abort(); };
  }, [refresh]);
  useEffect(() => {
    void Linking.getInitialURL().then(url => { if (url) setPendingLink(deepLinkUrl(url)); }).catch(() => {});
    const subscription = Linking.addEventListener('url', ({ url }) => setPendingLink(deepLinkUrl(url)));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!pendingLink || loading) return;
    const entry = catalogue && [...catalogue.listings, ...catalogue.products, ...catalogue.perspectives, ...catalogue.practices].find(item => new URL(item.href).pathname === new URL(pendingLink).pathname);
    if (entry) setSelected(entry); else void openWebsite(pendingLink);
    setPendingLink(null);
  }, [pendingLink, catalogue, loading]);
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selected) { setSelected(null); return true; }
      if (tab === 'More' && moreSection !== 'menu') { setMoreSection('menu'); return true; }
      if (tab !== 'Home') { setTab('Home'); return true; }
      return false;
    }); return () => subscription.remove();
  }, [selected, tab, moreSection]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => subscription.remove();
  }, [refresh]);

  const changeTab = (next: Tab) => { setTab(next); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const explore = (nextKind = 'all') => { setQuery(''); setCity('all'); setKind(nextKind); changeTab('Explore'); };
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [moreSection]);
  const retryShortlist = async () => {
    try { const value = await readSaved(); setSavedState(catalogue && fresh ? reconcileSaved(value, catalogue) : value); savedReadable.current = true; setSavedError(false); }
    catch { Alert.alert('Shortlist unavailable', 'Your stored shortlist has been preserved. Free some device storage and try again.'); }
  };
  const savedKeys = new Set(saved.filter(s => !s.withdrawn).map(s => entryKey(s.entry)));
  const toggleSave = async (entry: Entry) => {
    if (!savedReadable.current) { Alert.alert('Shortlist unavailable', 'Open Saved and retry loading your shortlist before making changes.'); return; }
    const key = entryKey(entry);
    const now = new Date().toISOString();
    try { await mutateSaved(old => {
      if (old.length >= 250 && !old.some(s => entryKey(s.entry) === key)) { Alert.alert('Shortlist is full', 'Remove an item before saving another. You can keep up to 250 public items on this device.'); return old; }
      return old.some(s => entryKey(s.entry) === key) ? old.filter(s => entryKey(s.entry) !== key) : [{ entry, saved_at: now, cached_at: catalogue?.generated_at || now, withdrawn: false }, ...old];
    }); }
    catch { Alert.alert('Could not save on this device', 'Free some device storage and try again.'); }
  };
  const cards = (entries: Entry[]) => entries.map(entry => <Card key={entryKey(entry)} entry={entry} saved={savedKeys.has(entryKey(entry))} onOpen={() => setSelected(entry)} onSave={() => void toggleSave(entry)} />);
  const catalogueUnavailable = !catalogue && !loading;
  const noCatalogue = <Empty title="Let’s get you connected" text="Our public catalogue could not load. Your saved shortlist is still available on this device." action="Try again" onPress={() => void refresh()} />;
  const residences = catalogue?.residences;
  const listings = filterEntries(catalogue?.listings || [], query, kind, city);
  const products = filterEntries(catalogue?.products || [], productQuery, 'all', 'all', category);
  const cities = [...new Set(catalogue?.listings.map(entry => entry.city).filter(Boolean))].sort();
  const productCategories = [...new Set(catalogue?.products.map(entry => entry.category).filter(Boolean))].sort();
  const links = catalogue?.links || { portal: `${ORIGIN}/account`, gullu: `${ORIGIN}/gullu`, privacy: `${ORIGIN}/privacy`, contact: `${ORIGIN}/contact`, delete_account: `${ORIGIN}/account/privacy` };
  const savedDetail = selected && saved.find(s => entryKey(s.entry) === entryKey(selected));

  return <SafeAreaView style={styles.shell} edges={['top', 'left', 'right']}>
    <StatusBar style="dark" />
    <View style={styles.header}><Image source={require('../assets/logo-dark.png')} style={styles.headerLogo} resizeMode="contain" accessibilityLabel="India Gully — Celebrating Desiness" /><View style={styles.headerActions}><Pressable accessibilityRole="button" accessibilityLabel="Ask Gullu, opens the secure website" onPress={() => void openWebsite(links.gullu)} style={styles.gulluButton}><Ionicons name="chatbubble-ellipses-outline" size={21} color={colors.ink} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Sign in to your client account" onPress={() => setPublicWebsite('client')} style={styles.signInButton}><Ionicons name="person-circle-outline" size={20} color={colors.white} /><Text style={styles.signInText}>Sign in</Text></Pressable></View></View>
    <ScrollView ref={scroll} style={styles.content} contentContainerStyle={styles.contentInner} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={refreshing && !loading} onRefresh={() => void refresh()} tintColor={colors.gold} colors={[colors.gold]} />}>
      {!!notice && <View style={styles.notice} accessibilityLiveRegion="polite"><Ionicons name="cloud-offline-outline" size={20} color={colors.gold} /><View style={{ flex: 1 }}><Text style={styles.noticeText}>{notice}</Text>{catalogue && !fresh && <Text style={styles.meta}>Saved catalogue: {formatDate(catalogue.generated_at)}. Availability may have changed.</Text>}</View><Pressable onPress={() => void refresh()} accessibilityRole="button" accessibilityLabel="Refresh catalogue" style={styles.iconButton}><Ionicons name="refresh" size={21} color={colors.ink} /></Pressable></View>}
      {loading && !catalogue && <View style={styles.loading}><ActivityIndicator size="large" color={colors.gold} /><Text style={styles.secondary}>Opening the gully…</Text></View>}

      {tab === 'Home' && <>
        <View style={styles.hero}><Eyebrow light>Ideas. Opportunities. Possibilities.</Eyebrow><Text accessibilityRole="header" style={styles.heroTitle}>A world of opportunity.{`\n`}A personal connection.</Text><Text style={styles.heroText}>Explore properties, hospitality essentials and the people who help bring your ambitions to life.</Text><Button label="Explore opportunities" onPress={() => explore()} secondary /></View>
        <View style={styles.clientWelcome}><View style={styles.clientWelcomeCopy}><Text style={styles.clientWelcomeTitle}>Your India Gully account</Text><Text style={styles.clientWelcomeText}>Sign in or register to access your dashboard and shared data rooms.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Client sign in or register" onPress={() => setPublicWebsite('client')} style={styles.clientWelcomeAction}><Ionicons name="person-outline" size={22} color={colors.gold} /><Text style={styles.textActionText}>Sign in</Text></Pressable></View>
        <View style={styles.quickRow}>{[{ label: 'Buy & invest', icon: 'business-outline' as Icon, run: () => explore('opportunity') }, { label: 'Leasing', icon: 'key-outline' as Icon, run: () => explore('promoter') }, { label: 'HORECA', icon: 'restaurant-outline' as Icon, run: () => changeTab('HORECA') }].map(item => <Pressable key={item.label} onPress={item.run} accessibilityRole="button" style={styles.quick}><Ionicons name={item.icon} color={colors.gold} size={25} /><Text style={styles.quickLabel}>{item.label}</Text></Pressable>)}</View>
        {residences && <View style={styles.residence}><Photo uri={residences.image} alt={residences.image_alt || residences.title} style={styles.residencePhoto} /><View style={styles.residenceBody}><Eyebrow>Our signature residences</Eyebrow><Text style={styles.residenceTitle}>{residences.headline || residences.title}</Text><Text style={styles.location}>{residences.location}</Text><Text style={styles.paragraph}>{residences.description}</Text><Button label={residences.cta_label} onPress={() => void openWebsite(residences.cta_href)} /><Text style={styles.browserNote}>Opens our secure website</Text></View></View>}
        <Heading title="Your next opportunity" subtitle="Discover our published property and leasing briefs." action="View all" onPress={() => explore()} />
        {catalogueUnavailable ? noCatalogue : cards(filterEntries(catalogue?.listings || [], '').slice(0, 3))}
        {catalogue && !catalogue.listings.length && <Empty title="More opportunities are on the way" text="Speak with our team about what you’re looking for." action="Contact our team" onPress={() => void openWebsite(links.contact)} />}
        <Heading title="A fresh perspective" subtitle="Ideas and insights from India Gully." action="Read all" onPress={() => { setMoreSection('perspectives'); changeTab('More'); }} />
        {cards((catalogue?.perspectives || []).slice(0, 2))}
        <View style={styles.practiceTeaser}><Eyebrow>One connected practice</Eyebrow><Text style={styles.sectionTitle}>A conversation can open doors.</Text><Text style={styles.paragraph}>Get to know our practices, then tell us what you have in mind.</Text><Button label="Explore our practices" secondary onPress={() => { setMoreSection('practices'); changeTab('More'); }} /></View>
        <View style={styles.careersCard}><Ionicons name="people-outline" size={29} color={colors.gold} /><Eyebrow>Careers at India Gully</Eyebrow><Text style={styles.sectionTitle}>Bring your perspective.</Text><Text style={styles.paragraph}>Explore opportunities to join our team and help shape what comes next.</Text><Button label="Explore careers" secondary icon="briefcase-outline" onPress={() => setPublicWebsite('careers')} /></View>
      </>}

      {tab === 'Explore' && <>
        <Eyebrow>Discover with India Gully</Eyebrow><Text accessibilityRole="header" style={styles.pageTitle}>Find your opportunity.</Text><Text style={styles.pageIntro}>Properties to invest in. Spaces to lease. Brands looking for their next address.</Text>
        <View style={styles.search}><Ionicons name="search-outline" size={21} color={colors.muted} /><TextInput accessibilityLabel="Search properties and leasing mandates" placeholder="City, property or asset type" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} style={styles.searchInput} returnKeyType="search" autoCorrect={false} />{!!query && <IconButton name="close-circle-outline" label="Clear property search" onPress={() => setQuery('')} />}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{[{ id: 'all', label: 'All opportunities' }, { id: 'opportunity', label: 'Buy & invest' }, { id: 'promoter', label: 'Spaces for lease' }, { id: 'brand', label: 'Brand requirements' }].map(filter => <Chip key={filter.id} label={filter.label} selected={kind === filter.id} onPress={() => setKind(filter.id)} />)}</ScrollView>
        {!!cities.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><Chip label="All locations" selected={city === 'all'} onPress={() => setCity('all')} />{cities.map(item => <Chip key={item} label={item} selected={city === item} onPress={() => setCity(item)} />)}</ScrollView>}
        <Text style={styles.resultCount}>{listings.length} {listings.length === 1 ? 'published brief' : 'published briefs'}</Text>
        {catalogueUnavailable ? noCatalogue : listings.length ? cards(listings) : !loading && <Empty title="Let’s widen the search" text="There are no published briefs matching these filters. Clear them or ask our team about your requirements." action="Clear filters" onPress={() => { setQuery(''); setKind('all'); setCity('all'); }} />}
        <Text style={styles.footnote}>Published information is for initial exploration. Confirm current availability and terms with our team.</Text>
      </>}

      {tab === 'HORECA' && <>
        <Eyebrow>Hospitality, thoughtfully supplied</Eyebrow><Text accessibilityRole="header" style={styles.pageTitle}>The details make{`\n`}the experience.</Text><Text style={styles.pageIntro}>Explore our hospitality collections, then shortlist the products for your project.</Text>
        <View style={styles.search}><Ionicons name="search-outline" size={21} color={colors.muted} /><TextInput accessibilityLabel="Search HORECA products by SKU, brand or category" placeholder="Search SKU, product or brand" placeholderTextColor={colors.muted} value={productQuery} onChangeText={setProductQuery} style={styles.searchInput} returnKeyType="search" autoCorrect={false} />{!!productQuery && <IconButton name="close-circle-outline" label="Clear product search" onPress={() => setProductQuery('')} />}</View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><Chip label="All collections" selected={category === 'all'} onPress={() => setCategory('all')} />{productCategories.map(item => <Chip key={item} label={catalogue?.categories.find(c => c.id === item)?.title || item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView>
        {category === 'all' && !productQuery && !!catalogue?.categories.length && <View style={styles.categoryGrid}>{catalogue.categories.map(item => <Pressable key={item.id} onPress={() => setCategory(item.id)} accessibilityRole="button" accessibilityLabel={`Explore ${item.title}`} style={styles.categoryCard}><Photo uri={item.image} alt={item.title} style={styles.categoryPhoto} /><Text style={styles.categoryTitle}>{item.title}</Text><Text style={styles.categoryCount}>{item.count ?? catalogue.products.filter(p => p.category === item.id).length} products →</Text></Pressable>)}</View>}
        <Text style={styles.resultCount}>{category === 'all' && !productQuery ? 'Choose a collection to explore its products.' : `${products.length} ${products.length === 1 ? 'product' : 'products'}${category !== 'all' ? ` · ${catalogue?.categories.find(c => c.id === category)?.title || category}` : ''}`}</Text>
        {catalogueUnavailable ? noCatalogue : (category !== 'all' || !!productQuery) && cards(products.slice(0, productLimit))}
        {!loading && catalogue && !products.length && <Empty title="No matching products yet" text="Try a different SKU or collection, or ask our team about sourcing for your project." action="Clear filters" onPress={() => { setProductQuery(''); setCategory('all'); }} />}
        {(category !== 'all' || !!productQuery) && products.length > productLimit && <Button label={`Show more products (${products.length - productLimit} remaining)`} secondary onPress={() => setProductLimit(n => n + 24)} />}
      </>}

      {tab === 'Saved' && <>
        <Eyebrow>Your personal shortlist</Eyebrow><Text accessibilityRole="header" style={styles.pageTitle}>Worth coming back to.</Text><Text style={styles.pageIntro}>Saved on this device for your next conversation. Public briefs are available offline; account and data-room information is never stored here.</Text>
        {savedError && <Empty title="Your shortlist could not be loaded" text="Your stored shortlist has been preserved. Retry before adding or removing saved items." action="Retry shortlist" onPress={() => void retryShortlist()} />}
        {!savedError && !saved.length && <Empty title="Make room for possibilities" text="Tap the bookmark on a property, product or Perspective to keep it here." icon="bookmark-outline" action="Explore opportunities" onPress={() => explore()} />}
        {saved.map(item => <View key={entryKey(item.entry)}>{item.withdrawn ? <View style={styles.withdrawn}><Eyebrow>No longer publicly listed</Eyebrow><Text style={styles.cardTitle}>{item.entry.title}</Text><Text style={styles.paragraph}>This item is no longer in our current public catalogue. Contact our team for an update.</Text><Button label="Remove from shortlist" secondary icon="trash-outline" onPress={() => void toggleSave(item.entry)} /></View> : <Card entry={item.entry} saved onOpen={() => setSelected(item.entry)} onSave={() => void toggleSave(item.entry)} />}<Text style={styles.savedDate}>Saved {formatDate(item.saved_at)} · Brief updated {formatDate(item.cached_at)}{!fresh ? '\nOffline copy — confirm availability and current terms.' : ''}</Text></View>)}
      </>}

      {tab === 'More' && <>
        {moreSection !== 'menu' && <Pressable accessibilityRole="button" onPress={() => setMoreSection('menu')} style={styles.backLink}><Ionicons name="arrow-back" color={colors.gold} size={20} /><Text style={styles.textActionText}>All of India Gully</Text></Pressable>}
        <Eyebrow>People. Ideas. Connection.</Eyebrow><Text accessibilityRole="header" style={styles.pageTitle}>{moreSection === 'perspectives' ? 'Perspectives' : moreSection === 'practices' ? 'Our practices' : 'Welcome to the gully.'}</Text>
        {moreSection === 'perspectives' && <>{cards(catalogue?.perspectives || [])}{!loading && !catalogue?.perspectives.length && <Empty title="A new perspective is coming" text="Refresh to see the latest published insights." action="Refresh" onPress={() => void refresh()} />}</>}
        {moreSection === 'practices' && <>{catalogue?.practices.map(entry => <Pressable key={entry.id} accessibilityRole="button" onPress={() => setSelected(entry)} style={styles.practiceCard}><Eyebrow>Our practice</Eyebrow><Text style={styles.cardTitle}>{entry.title}</Text><Text numberOfLines={4} style={styles.paragraph}>{entry.summary}</Text><Text style={styles.exploreLink}>Explore this practice ↗</Text></Pressable>)}{catalogueUnavailable && noCatalogue}</>}
        {moreSection === 'menu' && <>
          <View style={styles.buddyCard}><View style={styles.buddyIcon}><Ionicons name="chatbubbles-outline" size={35} color={colors.gold} /></View><Text style={styles.sectionTitle}>A little help from Gullu.</Text><Text style={styles.paragraph}>Your India Gully buddy. Explore our published opportunities and practices, or get pointed in the right direction.</Text><Button label="Chat with Gullu" onPress={() => void openWebsite(links.gullu)} /><Text style={styles.browserNote}>Opens our secure website. Gullu’s sign-in and consent choices remain on the website.</Text></View>
          {[{ title: 'Client sign in', detail: 'Sign in or register for your dashboard and shared data rooms.', icon: 'person-circle-outline' as Icon, action: () => setPublicWebsite('client'), browser: false }, { title: 'Our practices', detail: 'Explore how we can help your business.', icon: 'business-outline' as Icon, action: () => setMoreSection('practices'), browser: false }, { title: 'Perspectives', detail: 'Read the ideas shaping our world.', icon: 'newspaper-outline' as Icon, action: () => setMoreSection('perspectives'), browser: false }, { title: 'Careers', detail: 'Explore open roles and apply to join India Gully.', icon: 'briefcase-outline' as Icon, action: () => setPublicWebsite('careers'), browser: false }, { title: 'Speak with our team', detail: 'Tell us what you have in mind.', icon: 'people-outline' as Icon, action: () => void openWebsite(links.contact), browser: true }, { title: 'Privacy and your data', detail: 'Read our privacy notice.', icon: 'shield-checkmark-outline' as Icon, action: () => void openWebsite(links.privacy), browser: true }, { title: 'Delete account & data', detail: 'Request account deletion or manage your privacy rights.', icon: 'person-circle-outline' as Icon, action: () => void openWebsite(`${ORIGIN}/account/privacy?request=erasure`), browser: true }].map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${item.title}${item.browser ? ', opens secure website' : ''}`} onPress={item.action} style={styles.menuItem}><Ionicons name={item.icon} size={25} color={colors.gold} /><View style={{ flex: 1 }}><Text style={styles.menuTitle}>{item.title}</Text><Text style={styles.menuDetail}>{item.detail}</Text>{item.browser && <Text style={styles.browserTag}>SECURE WEBSITE ↗</Text>}</View><Ionicons name="chevron-forward" color={colors.muted} size={20} /></Pressable>)}
          <Pressable accessibilityRole="button" onPress={() => Alert.alert('Clear offline catalogue?', 'Your saved shortlist will stay on this device. The public catalogue will download again when you refresh.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Clear catalogue', onPress: () => { void clearPublicCache().then(() => Alert.alert('Offline catalogue cleared')).catch(() => Alert.alert('Could not clear catalogue', 'Please try again.')); } }])} style={styles.clearLink}><Text style={styles.textActionText}>Clear offline catalogue</Text></Pressable>
          <Text style={styles.about}>India Gully · Version 1.0.2{`\n`}Celebrating Desiness.{`\n\n`}Your shortlist stays on this device. Client sign-in, Careers and Staff workspace open inside India Gully. Enquiries and Gullu open our secure website.</Text>
          <View style={styles.staffAccess}>
            <Text style={styles.staffCaption}>FOR THE INDIA GULLY TEAM</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Staff workspace sign in" onPress={() => setStaffOpen(true)} style={styles.staffLink}>
              <Ionicons name="briefcase-outline" size={20} color={colors.gold} />
              <Text style={styles.staffLinkText}>Staff workspace sign in</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
            <Text style={styles.browserNote}>Sign in here with your staff account. Your browser sign-in is separate.</Text>
          </View>
        </>}
      </>}
      <View style={{ height: 24 }} />
    </ScrollView>
    <View style={[styles.tabs, { paddingBottom: Math.max(insets.bottom, 8) }]}>{tabs.map(item => <Pressable key={item.label} onPress={() => changeTab(item.label)} accessibilityRole="tab" accessibilityLabel={item.label} accessibilityState={{ selected: tab === item.label }} style={styles.tab}><Ionicons name={tab === item.label ? item.selected : item.icon} size={23} color={tab === item.label ? colors.gold : colors.muted} /><Text style={[styles.tabLabel, tab === item.label && styles.activeTab]}>{item.label}</Text>{item.label === 'Saved' && !!saved.length && <View style={styles.badge}><Text style={styles.badgeText}>{saved.length > 99 ? '99+' : saved.length}</Text></View>}</Pressable>)}</View>

    {publicWebsite && <SecureWebsite key={publicWebsite} mode={publicWebsite} onClose={() => setPublicWebsite(null)} />}
    {staffOpen && <StaffWorkspace onClose={() => setStaffOpen(false)} />}
    <Modal visible={!!selected} onRequestClose={() => setSelected(null)} animationType="slide" presentationStyle="pageSheet">
      {selected && <SafeAreaView style={styles.shell} edges={['top', 'left', 'right', 'bottom']}><View style={styles.detailHeader}><IconButton name="chevron-down" label="Close details" onPress={() => setSelected(null)} /><Text numberOfLines={1} style={styles.detailHeaderTitle}>{labelFor(selected)}</Text><IconButton name="share-outline" label={`Share ${selected.title}`} onPress={() => { void Share.share({ title: selected.title, message: `${selected.title}\n${selected.href}`, ...(Platform.OS === 'ios' ? { url: selected.href } : {}) }).catch(() => Alert.alert('Could not share', 'Please try again.')); }} /><IconButton name={savedKeys.has(entryKey(selected)) ? 'bookmark' : 'bookmark-outline'} label={savedKeys.has(entryKey(selected)) ? 'Remove from shortlist' : 'Save to shortlist'} onPress={() => void toggleSave(selected)} /></View>
        <ScrollView contentContainerStyle={styles.detailContent}><Photo uri={selected.image} alt={selected.image_alt || selected.title} style={styles.detailPhoto} fit={selected.type === 'product' ? 'contain' : 'cover'} /><View style={styles.detailBody}>
          <Eyebrow>{labelFor(selected)}</Eyebrow>{selected.type==='listing'&&!!selected.listing_status_text&&<Text style={styles.listingStatus}>{selected.listing_status_text}</Text>}<Text accessibilityRole="header" style={styles.detailTitle}>{selected.title}</Text>{!!selected.city && <Text style={styles.location}>{[selected.city, selected.region].filter(Boolean).join(', ')}</Text>}
          {!fresh && <View style={styles.notice}><Text style={styles.noticeText}>Saved public brief · {formatDate(savedDetail?.cached_at || catalogue?.generated_at || '')}. Availability and terms may have changed.</Text></View>}
          <View style={styles.facts}>{[['Asset', selected.asset_class], ['Transaction', selected.transaction_type], ['Area', [selected.area, selected.area_unit].filter(Boolean).join(' ')], ['Keys', selected.keys], ['Indicative price', selected.price_label], ['SKU', selected.sku], ['Brand', selected.brand], ['Minimum order', selected.moq], ['Pack size', selected.pack_size]].filter(([, value]) => !!value).map(([label, value]) => <View key={label} style={styles.fact}><Text style={styles.factLabel}>{label}</Text><Text style={styles.factValue}>{value}</Text></View>)}</View>
          {!!selected.published_at && <Text style={styles.meta}>Published {formatDate(selected.published_at)}</Text>}
          {(selected.body || selected.summary).split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <Text key={index} style={styles.detailParagraph}>{paragraph}</Text>)}
          {!!selected.tags.length && <View style={styles.tagRow}>{selected.tags.map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}</View>}
          {selected.body_truncated && <Text style={styles.footnote}>This is an excerpt. Open the full website brief for complete published information.</Text>}
          {(selected.type === 'listing' || selected.type === 'product') && <Text style={styles.footnote}>Please confirm current availability, specifications and terms with our team before making a decision.</Text>}
          <Button label="Read full website brief" secondary icon="open-outline" onPress={() => void openWebsite(selected.href)} /><Text style={styles.browserNote}>Opens our secure website</Text>
        </View></ScrollView>
        <View style={styles.detailFooter}><Button label={selected.type === 'product' ? 'Enquire about this product' : selected.type === 'listing' ? selected.listing_is_available ? 'Discuss this opportunity' : 'Explore available alternatives' : 'Speak with our team'} icon="chatbubble-outline" onPress={() => void openWebsite(enquiryUrl(selected, links.contact))} /><Text style={styles.browserNote}>Your enquiry opens on our secure website.</Text></View>
      </SafeAreaView>}
    </Modal>
  </SafeAreaView>;
}

export default function App() { return <SafeAreaProvider><AppContent /></SafeAreaProvider>; }

const styles = StyleSheet.create({
  listingStatus:{color:colors.ink,backgroundColor:colors.pale,paddingHorizontal:10,paddingVertical:7,marginTop:8,marginBottom:4,alignSelf:'flex-start',fontSize:13,fontWeight:'600'},
  shell: { flex: 1, backgroundColor: colors.paper }, header: { minHeight: 76, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, headerLogo: { width: 132, height: 40, flexShrink: 1 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 }, gulluButton: { justifyContent: 'center', alignItems: 'center', width: 44, minHeight: 44, paddingHorizontal: 9, backgroundColor: colors.pale, borderRadius: 24 }, gulluText: { fontSize: 12, fontWeight: '600', color: colors.ink }, content: { flex: 1 }, contentInner: { padding: 20, width: '100%', maxWidth: 800, alignSelf: 'center' },
  signInButton: { minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 22, backgroundColor: colors.ink }, signInText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  clientWelcome: { flexDirection: 'row', gap: 14, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 5, backgroundColor: colors.white, marginBottom: 18, alignItems: 'center' }, clientWelcomeCopy: { flex: 1 }, clientWelcomeTitle: { color: colors.ink, fontSize: 16, fontWeight: '600', marginBottom: 7 }, clientWelcomeText: { color: colors.muted, fontSize: 13, lineHeight: 21 }, clientWelcomeAction: { minHeight: 48, paddingHorizontal: 8, gap: 5, alignItems: 'center', justifyContent: 'center' }, careersCard: { padding: 24, gap: 10, borderWidth: 1, borderColor: colors.border, marginTop: 20, backgroundColor: colors.white },
  hero: { backgroundColor: colors.ink, borderRadius: 5, padding: 25, paddingVertical: 32, marginBottom: 18 }, heroTitle: { color: colors.white, fontFamily: serif, fontSize: 36, lineHeight: 43, marginTop: 18, marginBottom: 18 }, heroText: { color: '#e3e0d4', fontSize: 15, lineHeight: 24, marginBottom: 25 }, eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.7, lineHeight: 17 },
  button: { backgroundColor: colors.ink, paddingVertical: 15, paddingHorizontal: 18, minHeight: 50, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.ink, borderRadius: 3 }, buttonText: { color: colors.white, fontSize: 14, fontWeight: '600', flexShrink: 1 }, secondaryButton: { backgroundColor: colors.paper, borderColor: colors.border }, secondaryText: { color: colors.ink }, iconButton: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, pressed: { opacity: 0.65 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 18 }, quick: { flex: 1, borderWidth: 1, borderColor: colors.border, paddingVertical: 16, paddingHorizontal: 6, alignItems: 'center', gap: 9, backgroundColor: colors.white, borderRadius: 3 }, quickLabel: { fontSize: 12, fontWeight: '600', color: colors.ink }, heading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 22, marginBottom: 20 }, sectionTitle: { fontFamily: serif, color: colors.ink, fontSize: 27, lineHeight: 34 }, secondary: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 6 }, textAction: { paddingVertical: 14, paddingLeft: 4 }, textActionText: { color: colors.gold, fontWeight: '600', fontSize: 13 },
  card: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, marginBottom: 18, borderRadius: 5, overflow: 'hidden' }, photo: { width: '100%', height: 190, backgroundColor: colors.pale }, photoEmpty: { alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#eae5d8' }, photoMark: { width: 35, height: 54 }, photoEmptyText: { fontSize: 10, letterSpacing: 3, color: colors.gold, fontWeight: '600' }, cardBody: { padding: 20 }, cardTitle: { fontFamily: serif, color: colors.ink, fontSize: 24, lineHeight: 30, marginTop: 9, marginBottom: 9 }, location: { fontSize: 12, color: colors.gold, lineHeight: 20, marginBottom: 10 }, cardSummary: { fontSize: 14, color: colors.muted, lineHeight: 23, textAlign: 'justify' }, tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14, marginBottom: 3 }, tag: { color: colors.gold, backgroundColor: '#f3f0e7', fontSize: 10, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 2 }, exploreLink: { color: colors.gold, fontWeight: '600', fontSize: 13, marginTop: 18 }, cardSave: { position: 'absolute', top: 12, right: 12, backgroundColor: colors.paper, borderRadius: 23 },
  residence: { marginTop: 14, marginBottom: 10, borderWidth: 1, borderColor: '#b8a369', backgroundColor: '#f3efe3', borderRadius: 5, overflow: 'hidden' }, residencePhoto: { height: 215 }, residenceBody: { padding: 22 }, residenceTitle: { fontFamily: serif, fontSize: 32, lineHeight: 38, color: colors.ink, marginVertical: 14 }, paragraph: { color: colors.muted, fontSize: 14, lineHeight: 24, marginBottom: 18, marginTop: 8, textAlign: 'justify' }, browserNote: { color: colors.muted, fontSize: 10, lineHeight: 16, marginTop: 9, textAlign: 'center' },
  pageTitle: { fontFamily: serif, fontSize: 36, lineHeight: 42, color: colors.ink, marginTop: 14, marginBottom: 14 }, pageIntro: { color: colors.muted, fontSize: 14, lineHeight: 23, marginBottom: 20 }, search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, paddingLeft: 14, backgroundColor: colors.white, minHeight: 52, borderRadius: 4, marginBottom: 12 }, searchInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 14, fontSize: 14, color: colors.ink, minWidth: 0 }, chips: { gap: 7, paddingBottom: 12 }, chip: { borderColor: colors.border, borderWidth: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 12, minHeight: 44, justifyContent: 'center' }, chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink }, chipText: { color: colors.muted, fontSize: 12 }, chipTextSelected: { color: colors.white, fontWeight: '600' }, resultCount: { fontSize: 11, color: colors.muted, marginVertical: 17, letterSpacing: 0.5 }, meta: { fontSize: 11, color: colors.muted, lineHeight: 18, marginTop: 8 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 14 }, categoryCard: { width: '48%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: 'hidden', paddingBottom: 14 }, categoryPhoto: { height: 115 }, categoryTitle: { fontFamily: serif, fontSize: 19, lineHeight: 24, color: colors.ink, paddingHorizontal: 12, marginTop: 12 }, categoryCount: { color: colors.gold, fontSize: 11, paddingHorizontal: 12, marginTop: 7 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0ead8', padding: 13, borderRadius: 3, marginBottom: 18 }, noticeText: { fontSize: 12, color: colors.ink, lineHeight: 20 }, loading: { alignItems: 'center', padding: 26, gap: 10 }, empty: { padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 14, marginBottom: 22, backgroundColor: colors.white }, emptyTitle: { color: colors.ink, fontFamily: serif, fontSize: 25, textAlign: 'center' }, emptyText: { fontSize: 14, lineHeight: 23, color: colors.muted, textAlign: 'center' }, footnote: { color: colors.muted, fontSize: 11, lineHeight: 18, marginVertical: 20 }, savedDate: { color: colors.muted, fontSize: 10, lineHeight: 17, marginTop: -9, marginBottom: 23, paddingHorizontal: 4 }, withdrawn: { borderWidth: 1, borderColor: colors.border, padding: 20, marginBottom: 20, backgroundColor: colors.pale },
  practiceTeaser: { padding: 24, backgroundColor: colors.pale, gap: 12, marginTop: 12 }, practiceCard: { padding: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, marginBottom: 14 }, buddyCard: { padding: 24, backgroundColor: colors.pale, marginVertical: 15, borderRadius: 5 }, buddyIcon: { paddingBottom: 18 }, menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderColor: colors.border, paddingVertical: 21 }, menuTitle: { fontSize: 15, fontWeight: '600', color: colors.ink }, menuDetail: { fontSize: 12, color: colors.muted, lineHeight: 19, marginTop: 5 }, browserTag: { fontSize: 8, letterSpacing: 1, color: colors.gold, marginTop: 7 }, backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 15, marginBottom: 8 }, clearLink: { paddingVertical: 23, alignItems: 'center' }, about: { color: colors.muted, fontSize: 11, lineHeight: 19, textAlign: 'center', marginBottom: 16 },
  staffAccess: { borderTopWidth: 1, borderColor: colors.border, marginTop: 12, paddingTop: 24, paddingBottom: 8, alignItems: 'center' }, staffCaption: { color: colors.muted, fontSize: 9, lineHeight: 15, letterSpacing: 1.2, textAlign: 'center' }, staffLink: { minHeight: 48, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, staffLinkText: { color: colors.gold, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, paddingTop: 9, backgroundColor: colors.white }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 50, gap: 5 }, tabLabel: { color: colors.muted, fontSize: 10 }, activeTab: { color: colors.gold, fontWeight: '700' }, badge: { position: 'absolute', top: 0, right: '23%', backgroundColor: colors.ink, minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3, justifyContent: 'center', alignItems: 'center' }, badgeText: { color: colors.white, fontSize: 8, fontWeight: '600' },
  detailHeader: { minHeight: 58, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, detailHeaderTitle: { flex: 1, fontSize: 12, color: colors.gold, textTransform: 'uppercase', letterSpacing: 1 }, detailContent: { maxWidth: 800, width: '100%', alignSelf: 'center', paddingBottom: 20 }, detailPhoto: { height: 260 }, detailBody: { padding: 24 }, detailTitle: { fontFamily: serif, color: colors.ink, fontSize: 32, lineHeight: 40, marginTop: 14, marginBottom: 14 }, detailParagraph: { fontSize: 15, color: colors.ink, lineHeight: 27, marginBottom: 18, textAlign: 'justify' }, facts: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginVertical: 18 }, fact: { width: '44%' }, factLabel: { fontSize: 10, color: colors.muted, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 5 }, factValue: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '600' }, detailFooter: { padding: 16, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
});
