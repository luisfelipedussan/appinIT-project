import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VintageButtonComponent } from './vintage-button.component';

describe('VintageButtonComponent', () => {
  let component: VintageButtonComponent;
  let fixture: ComponentFixture<VintageButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VintageButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VintageButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
