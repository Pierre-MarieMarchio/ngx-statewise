import { TestBed } from '@angular/core/testing';
import { TaskSearchComponent } from './task-search.component';

describe('TaskSearchComponent', () => {
  const mount = async () => {
    await TestBed.configureTestingModule({
      imports: [TaskSearchComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskSearchComponent);
    fixture.detectChanges();

    const queried: string[] = [];
    let cleared = 0;
    fixture.componentInstance.queried.subscribe((query) => queried.push(query));
    fixture.componentInstance.cleared.subscribe(() => (cleared += 1));

    return {
      fixture,
      queried,
      cleared: () => cleared,
      type: (value: string) => {
        fixture.componentInstance.onInput(value);
        fixture.detectChanges();
      },
    };
  };

  const settle = () =>
    new Promise<void>((resolve) => {
      setTimeout(resolve, 200);
    });

  it('waits for the typist to stop before asking', async () => {
    const box = await mount();

    box.type('a');
    box.type('an');
    box.type('ang');

    expect(box.queried).toEqual([]);

    await settle();

    expect(box.queried).toEqual(['ang']);
  });

  it('trims what it asks for', async () => {
    const box = await mount();

    box.type('  angular  ');
    await settle();

    expect(box.queried).toEqual(['angular']);
  });

  /** Emptying the box is not a query. It says there is no filter at all. */
  it('reports a clear rather than an empty query', async () => {
    const box = await mount();

    box.type('ang');
    box.type('');
    await settle();

    expect(box.queried).toEqual([]);
    expect(box.cleared()).toBe(1);
  });

  it('drops a pending query when the box is emptied', async () => {
    const box = await mount();

    box.type('ang');
    box.type('   ');
    await settle();

    expect(box.queried).toEqual([]);
  });

  it('clears from the button, and stops offering it when empty', async () => {
    const box = await mount();
    const host = box.fixture.nativeElement as HTMLElement;

    box.type('ang');
    expect(
      host.querySelector('button[aria-label="Clear the search"]'),
    ).not.toBeNull();

    box.fixture.componentInstance.clear();
    box.fixture.detectChanges();

    expect(box.fixture.componentInstance.query()).toBe('');
    expect(box.cleared()).toBe(1);
    expect(
      host.querySelector('button[aria-label="Clear the search"]'),
    ).toBeNull();
  });

  /**
   * A timer outliving its box would emit into a torn-down view. Destroying
   * before it fires has to be silent.
   */
  it('drops a pending query when it is destroyed', async () => {
    const box = await mount();

    box.type('ang');
    box.fixture.destroy();
    await settle();

    expect(box.queried).toEqual([]);
  });

  it('says it is searching only while it is', async () => {
    const box = await mount();
    const region = () =>
      (box.fixture.nativeElement as HTMLElement)
        .querySelector('output')
        ?.textContent?.trim();

    expect(region()).toBe('');

    box.fixture.componentRef.setInput('searching', true);
    box.fixture.detectChanges();

    expect(region()).toBe('Searching');
  });
});
