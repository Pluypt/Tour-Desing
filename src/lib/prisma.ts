import { adminDb } from './firebaseAdmin';
import { formatDocData, generateId } from './db';

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error('Firestore operation error:', error);
    return fallback;
  }
}

function asObject(val: any): Record<string, any> {
  const formatted = formatDocData<any>(val);
  return (formatted && typeof formatted === 'object') ? formatted : {};
}

function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map(cleanData);
  if (typeof obj === 'object' && !(obj instanceof Date) && typeof obj.toDate !== 'function') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      if (obj[key] !== undefined) {
        cleaned[key] = cleanData(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

// ----------------------------------------------------
// Customer Model Adapter
// ----------------------------------------------------
const customerAdapter = {
  async count(args?: { where?: any }): Promise<number> {
    return safeQuery(async () => {
      let q: any = adminDb.collection('customers');
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
          if (val !== undefined && val !== null) {
            q = q.where(key, '==', val);
          }
        }
      }
      const snapshot = await q.count().get();
      return snapshot.data().count;
    }, 0);
  },

  async findMany(args?: { where?: any; orderBy?: any; take?: number; include?: any }): Promise<any[]> {
    return safeQuery(async () => {
      let q: any = adminDb.collection('customers');
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
          if (val !== undefined && val !== null) {
            q = q.where(key, '==', val);
          }
        }
      }
      if (args?.take) {
        q = q.limit(args.take);
      }
      const snapshot = await q.get();
      const customers = snapshot.docs.map((doc: any) => ({ id: doc.id, ...asObject(doc.data()) }));

      if (args?.include?._count?.select?.TourPlans) {
        for (const customer of customers) {
          const planSnap = await adminDb.collection('tour_plans').where('customer_id', '==', customer.id).count().get();
          customer._count = { TourPlans: planSnap.data().count };
        }
      }

      if (args?.include?.TourPlans) {
        for (const customer of customers) {
          const planSnap = await adminDb.collection('tour_plans').where('customer_id', '==', customer.id).get();
          customer.TourPlans = planSnap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
        }
      }

      return customers;
    }, []);
  },

  async findUnique(args: { where: { id: string }; include?: any }): Promise<any | null> {
    return safeQuery(async () => {
      if (!args.where.id) return null;
      const doc = await adminDb.collection('customers').doc(args.where.id).get();
      if (!doc.exists) return null;

      const customer: any = { id: doc.id, ...asObject(doc.data()) };

      if (args?.include?.TourPlans) {
        const planSnap = await adminDb.collection('tour_plans').where('customer_id', '==', customer.id).get();
        customer.TourPlans = planSnap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
      }

      return customer;
    }, null);
  },

  async create(args: { data: any }): Promise<any> {
    const id = args.data.id || generateId();
    const now = new Date();
    const data = {
      ...args.data,
      id,
      created_at: args.data.created_at || now,
      updated_at: args.data.updated_at || now,
    };
    await adminDb.collection('customers').doc(id).set(cleanData(data), { merge: true });
    return asObject(data);
  },

  async update(args: { where: { id: string }; data: any }): Promise<any> {
    const id = args.where.id;
    const now = new Date();
    const data = {
      ...args.data,
      updated_at: now,
    };
    await adminDb.collection('customers').doc(id).set(cleanData(data), { merge: true });
    const doc = await adminDb.collection('customers').doc(id).get();
    return { id: doc.id, ...asObject(doc.data()) };
  },

  async delete(args: { where: { id: string } }): Promise<any> {
    const id = args.where.id;
    const doc = await adminDb.collection('customers').doc(id).get();
    const data = doc.exists ? { id: doc.id, ...asObject(doc.data()) } : { id };
    await adminDb.collection('customers').doc(id).delete();
    return data;
  }
};

// ----------------------------------------------------
// Helper: Load full relations for a TourPlan
// ----------------------------------------------------
async function populateTourPlanRelations(plan: any, include?: any) {
  if (!plan) return plan;

  if (include?.customer || include?.Customer || plan.customer_id) {
    if (plan.customer_id) {
      const custDoc = await adminDb.collection('customers').doc(plan.customer_id).get();
      if (custDoc.exists) {
        plan.customer = { id: custDoc.id, ...asObject(custDoc.data()) };
      }
    }
  }

  if (include?.TourDays || include?.tour_days) {
    const daysSnap = await adminDb.collection('tour_plans').doc(plan.id).collection('days').orderBy('day_number', 'asc').get();
    const days = [];
    for (const dDoc of daysSnap.docs) {
      const day: any = { id: dDoc.id, ...asObject(dDoc.data()) };

      if (include?.TourDays?.include?.TourActivities || include?.tour_days?.include?.TourActivities) {
        const actSnap = await dDoc.ref.collection('activities').orderBy('sort_order', 'asc').get();
        day.TourActivities = actSnap.docs.map((a: any) => ({ id: a.id, ...asObject(a.data()) }));
      } else {
        day.TourActivities = day.TourActivities || [];
      }

      if (include?.TourDays?.include?.TourDayImages || include?.tour_days?.include?.TourDayImages) {
        const imgSnap = await dDoc.ref.collection('images').orderBy('sort_order', 'asc').get();
        day.TourDayImages = imgSnap.docs.map((i: any) => ({ id: i.id, ...asObject(i.data()) }));
      } else {
        day.TourDayImages = day.TourDayImages || [];
      }

      days.push(day);
    }
    plan.TourDays = days;
  } else {
    plan.TourDays = plan.TourDays || [];
  }

  if (include?.Hotels) {
    const snap = await adminDb.collection('tour_plans').doc(plan.id).collection('hotels').get();
    plan.Hotels = snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
  } else {
    plan.Hotels = plan.Hotels || [];
  }

  if (include?.Inclusions) {
    const snap = await adminDb.collection('tour_plans').doc(plan.id).collection('inclusions').orderBy('sort_order', 'asc').get();
    plan.Inclusions = snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
  } else {
    plan.Inclusions = plan.Inclusions || [];
  }

  if (include?.Exclusions) {
    const snap = await adminDb.collection('tour_plans').doc(plan.id).collection('exclusions').orderBy('sort_order', 'asc').get();
    plan.Exclusions = snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
  } else {
    plan.Exclusions = plan.Exclusions || [];
  }

  if (include?.CostItems) {
    const snap = await adminDb.collection('tour_plans').doc(plan.id).collection('cost_items').orderBy('sort_order', 'asc').get();
    plan.CostItems = snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
  } else {
    plan.CostItems = plan.CostItems || [];
  }

  if (include?.CoverDesigns) {
    const snap = await adminDb.collection('tour_plans').doc(plan.id).collection('covers').get();
    plan.CoverDesigns = snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
  } else {
    plan.CoverDesigns = plan.CoverDesigns || [];
  }

  if (include?.TourVersions) {
    const snap = await adminDb.collection('tour_plans').doc(plan.id).collection('versions').orderBy('version_no', 'desc').get();
    plan.TourVersions = snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
  } else {
    plan.TourVersions = plan.TourVersions || [];
  }

  return plan;
}

// ----------------------------------------------------
// TourPlan Model Adapter
// ----------------------------------------------------
const tourPlanAdapter = {
  async count(args?: { where?: any }): Promise<number> {
    return safeQuery(async () => {
      let q: any = adminDb.collection('tour_plans');
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
          if (val !== undefined && val !== null) {
            q = q.where(key, '==', val);
          }
        }
      }
      const snapshot = await q.count().get();
      return snapshot.data().count;
    }, 0);
  },

  async findMany(args?: { where?: any; orderBy?: any; take?: number; include?: any }): Promise<any[]> {
    return safeQuery(async () => {
      let q: any = adminDb.collection('tour_plans');
      if (args?.where) {
        for (const [key, val] of Object.entries(args.where)) {
          if (val !== undefined && val !== null) {
            q = q.where(key, '==', val);
          }
        }
      }
      if (args?.take) {
        q = q.limit(args.take);
      }

      const snapshot = await q.get();
      let plans = snapshot.docs.map((doc: any) => ({ id: doc.id, ...asObject(doc.data()) }));

      if (args?.orderBy?.updated_at === 'desc') {
        plans.sort((a: any, b: any) => new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime());
      }

      if (args?.include) {
        for (let i = 0; i < plans.length; i++) {
          plans[i] = await populateTourPlanRelations(plans[i], args.include);
        }
      }

      return plans;
    }, []);
  },

  async findUnique(args: { where: { id: string }; include?: any }): Promise<any | null> {
    return safeQuery(async () => {
      if (!args.where.id) return null;
      const doc = await adminDb.collection('tour_plans').doc(args.where.id).get();
      if (!doc.exists) return null;

      let plan: any = { id: doc.id, ...asObject(doc.data()) };
      plan = await populateTourPlanRelations(plan, args.include || {
        customer: true,
        TourDays: { include: { TourActivities: true, TourDayImages: true } },
        Hotels: true,
        Inclusions: true,
        Exclusions: true,
        CostItems: true,
        CoverDesigns: true,
        TourVersions: true,
      });

      return plan;
    }, null);
  },

  async findFirst(args?: { where?: any; include?: any }): Promise<any | null> {
    const results = await this.findMany({ ...args, take: 1 });
    return results[0] || null;
  },

  async create(args: { data: any; include?: any }): Promise<any> {
    const planId = args.data.id || generateId();
    const now = new Date();

    const { TourDays, Hotels, Inclusions, Exclusions, CostItems, CoverDesigns, ...mainData } = args.data;

    const planData = {
      ...mainData,
      id: planId,
      status: mainData.status || 'Draft',
      created_at: mainData.created_at || now,
      updated_at: mainData.updated_at || now,
    };

    await adminDb.collection('tour_plans').doc(planId).set(cleanData(planData), { merge: true });
    const planRef = adminDb.collection('tour_plans').doc(planId);

    if (TourDays?.create) {
      const daysToCreate = Array.isArray(TourDays.create) ? TourDays.create : [TourDays.create];
      for (const d of daysToCreate) {
        const dayId = d.id || generateId();
        const { TourActivities, TourDayImages, ...dayData } = d;
        const dayRef = planRef.collection('days').doc(dayId);
        await dayRef.set(cleanData({ ...dayData, id: dayId, tour_plan_id: planId, created_at: now, updated_at: now }), { merge: true });

        if (TourActivities?.create) {
          const acts = Array.isArray(TourActivities.create) ? TourActivities.create : [TourActivities.create];
          for (const a of acts) {
            const actId = a.id || generateId();
            await dayRef.collection('activities').doc(actId).set(cleanData({ ...a, id: actId, tour_day_id: dayId, created_at: now, updated_at: now }), { merge: true });
          }
        }

        if (TourDayImages?.create) {
          const imgs = Array.isArray(TourDayImages.create) ? TourDayImages.create : [TourDayImages.create];
          for (const img of imgs) {
            const imgId = img.id || generateId();
            await dayRef.collection('images').doc(imgId).set(cleanData({ ...img, id: imgId, tour_day_id: dayId, created_at: now, updated_at: now }), { merge: true });
          }
        }
      }
    }

    if (Hotels?.create) {
      const hotels = Array.isArray(Hotels.create) ? Hotels.create : [Hotels.create];
      for (const h of hotels) {
        const hId = h.id || generateId();
        await planRef.collection('hotels').doc(hId).set(cleanData({ ...h, id: hId, tour_plan_id: planId }), { merge: true });
      }
    }

    if (Inclusions?.create) {
      const incs = Array.isArray(Inclusions.create) ? Inclusions.create : [Inclusions.create];
      for (const inc of incs) {
        const incId = inc.id || generateId();
        await planRef.collection('inclusions').doc(incId).set(cleanData({ ...inc, id: incId, tour_plan_id: planId }), { merge: true });
      }
    }

    if (Exclusions?.create) {
      const excs = Array.isArray(Exclusions.create) ? Exclusions.create : [Exclusions.create];
      for (const exc of excs) {
        const excId = exc.id || generateId();
        await planRef.collection('exclusions').doc(excId).set(cleanData({ ...exc, id: excId, tour_plan_id: planId }), { merge: true });
      }
    }

    return this.findUnique({ where: { id: planId }, include: args.include });
  },

  async update(args: { where: { id: string }; data: any; include?: any }): Promise<any> {
    const planId = args.where.id;
    const now = new Date();

    const { TourDays, Hotels, Inclusions, Exclusions, CostItems, CoverDesigns, ...mainData } = args.data;

    await adminDb.collection('tour_plans').doc(planId).set(cleanData({
      ...mainData,
      updated_at: now,
    }), { merge: true });

    return this.findUnique({ where: { id: planId }, include: args.include });
  },

  async delete(args: { where: { id: string } }): Promise<any> {
    const planId = args.where.id;
    const planRef = adminDb.collection('tour_plans').doc(planId);
    await planRef.delete();
    return { id: planId };
  }
};

// ----------------------------------------------------
// TourDay Adapter
// ----------------------------------------------------
const tourDayAdapter = {
  async findMany(args?: { where?: { tour_plan_id?: string }; include?: any }): Promise<any[]> {
    return safeQuery(async () => {
      const planId = args?.where?.tour_plan_id;
      if (!planId) return [];
      const snap = await adminDb.collection('tour_plans').doc(planId).collection('days').orderBy('day_number', 'asc').get();
      const days = [];
      for (const doc of snap.docs) {
        const day: any = { id: doc.id, tour_plan_id: planId, ...asObject(doc.data()) };
        if (args?.include?.TourActivities) {
          const actSnap = await doc.ref.collection('activities').orderBy('sort_order', 'asc').get();
          day.TourActivities = actSnap.docs.map((a: any) => ({ id: a.id, ...asObject(a.data()) }));
        }
        if (args?.include?.TourDayImages) {
          const imgSnap = await doc.ref.collection('images').orderBy('sort_order', 'asc').get();
          day.TourDayImages = imgSnap.docs.map((i: any) => ({ id: i.id, ...asObject(i.data()) }));
        }
        days.push(day);
      }
      return days;
    }, []);
  },

  async findUnique(args: { where: { id: string }; include?: any }): Promise<any | null> {
    return safeQuery(async () => {
      const plans = await adminDb.collection('tour_plans').get();
      for (const planDoc of plans.docs) {
        const dayDoc = await planDoc.ref.collection('days').doc(args.where.id).get();
        if (dayDoc.exists) {
          const day: any = { id: dayDoc.id, tour_plan_id: planDoc.id, ...asObject(dayDoc.data()) };
          if (args?.include?.TourActivities) {
            const actSnap = await dayDoc.ref.collection('activities').orderBy('sort_order', 'asc').get();
            day.TourActivities = actSnap.docs.map((a: any) => ({ id: a.id, ...asObject(a.data()) }));
          }
          if (args?.include?.TourDayImages) {
            const imgSnap = await dayDoc.ref.collection('images').orderBy('sort_order', 'asc').get();
            day.TourDayImages = imgSnap.docs.map((i: any) => ({ id: i.id, ...asObject(i.data()) }));
          }
          return day;
        }
      }
      return null;
    }, null);
  },

  async create(args: { data: any }): Promise<any> {
    const id = args.data.id || generateId();
    const planId = args.data.tour_plan_id;
    const now = new Date();
    const ref = adminDb.collection('tour_plans').doc(planId).collection('days').doc(id);
    const data = { ...args.data, id, created_at: now, updated_at: now };
    await ref.set(data, { merge: true });
    return asObject(data);
  },

  async update(args: { where: { id: string }; data: any }): Promise<any> {
    const day = await this.findUnique({ where: { id: args.where.id } });
    if (!day) throw new Error('TourDay not found');

    const dayRef = adminDb.collection('tour_plans').doc(day.tour_plan_id).collection('days').doc(day.id);
    await dayRef.set({ ...args.data, updated_at: new Date() }, { merge: true });
    return this.findUnique({ where: { id: day.id } });
  },

  async delete(args: { where: { id: string } }): Promise<any> {
    const day = await this.findUnique({ where: { id: args.where.id } });
    if (day) {
      await adminDb.collection('tour_plans').doc(day.tour_plan_id).collection('days').doc(day.id).delete();
    }
    return { id: args.where.id };
  }
};

// ----------------------------------------------------
// TourActivity Adapter
// ----------------------------------------------------
const tourActivityAdapter = {
  async findMany(args?: { where?: { tour_day_id?: string } }): Promise<any[]> {
    return safeQuery(async () => {
      const dayId = args?.where?.tour_day_id;
      if (!dayId) return [];
      const day = await tourDayAdapter.findUnique({ where: { id: dayId } });
      if (!day) return [];
      const snap = await adminDb.collection('tour_plans').doc(day.tour_plan_id).collection('days').doc(dayId).collection('activities').orderBy('sort_order', 'asc').get();
      return snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
    }, []);
  },

  async create(args: { data: any }): Promise<any> {
    const actId = args.data.id || generateId();
    const dayId = args.data.tour_day_id;

    const day = await tourDayAdapter.findUnique({ where: { id: dayId } });
    if (!day) throw new Error('Parent TourDay not found');

    const actRef = adminDb.collection('tour_plans').doc(day.tour_plan_id).collection('days').doc(dayId).collection('activities').doc(actId);
    const data = { ...args.data, id: actId, created_at: new Date(), updated_at: new Date() };
    await actRef.set(data, { merge: true });
    return asObject(data);
  },

  async update(args: { where: { id: string }; data: any }): Promise<any> {
    const plans = await adminDb.collection('tour_plans').get();
    for (const planDoc of plans.docs) {
      const days = await planDoc.ref.collection('days').get();
      for (const dayDoc of days.docs) {
        const actRef = dayDoc.ref.collection('activities').doc(args.where.id);
        const actDoc = await actRef.get();
        if (actDoc.exists) {
          await actRef.set({ ...args.data, updated_at: new Date() }, { merge: true });
          const updated = await actRef.get();
          return { id: updated.id, ...asObject(updated.data()) };
        }
      }
    }
    return null;
  },

  async delete(args: { where: { id: string } }): Promise<any> {
    const plans = await adminDb.collection('tour_plans').get();
    for (const planDoc of plans.docs) {
      const days = await planDoc.ref.collection('days').get();
      for (const dayDoc of days.docs) {
        const actRef = dayDoc.ref.collection('activities').doc(args.where.id);
        const actDoc = await actRef.get();
        if (actDoc.exists) {
          await actRef.delete();
          return { id: args.where.id };
        }
      }
    }
    return { id: args.where.id };
  }
};

// ----------------------------------------------------
// TourDayImage Adapter
// ----------------------------------------------------
const tourDayImageAdapter = {
  async findMany(args?: { where?: any; orderBy?: any }): Promise<any[]> {
    return safeQuery(async () => {
      const dayId = args?.where?.tour_day_id;
      if (!dayId) return [];
      const day = await tourDayAdapter.findUnique({ where: { id: dayId } });
      if (!day) return [];

      const snap = await adminDb.collection('tour_plans').doc(day.tour_plan_id).collection('days').doc(dayId).collection('images').get();
      return snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
    }, []);
  },

  async create(args: { data: any }): Promise<any> {
    const imgId = args.data.id || generateId();
    const dayId = args.data.tour_day_id;
    const day = await tourDayAdapter.findUnique({ where: { id: dayId } });
    if (!day) throw new Error('Parent TourDay not found');

    const imgRef = adminDb.collection('tour_plans').doc(day.tour_plan_id).collection('days').doc(dayId).collection('images').doc(imgId);
    const data = { ...args.data, id: imgId, created_at: new Date(), updated_at: new Date() };
    await imgRef.set(data, { merge: true });
    return asObject(data);
  },

  async update(args: { where: { id: string }; data: any }): Promise<any> {
    const plans = await adminDb.collection('tour_plans').get();
    for (const planDoc of plans.docs) {
      const days = await planDoc.ref.collection('days').get();
      for (const dayDoc of days.docs) {
        const imgRef = dayDoc.ref.collection('images').doc(args.where.id);
        const imgDoc = await imgRef.get();
        if (imgDoc.exists) {
          await imgRef.set({ ...args.data, updated_at: new Date() }, { merge: true });
          const updated = await imgRef.get();
          return { id: updated.id, ...asObject(updated.data()) };
        }
      }
    }
    return null;
  },

  async delete(args: { where: { id: string } }): Promise<any> {
    const plans = await adminDb.collection('tour_plans').get();
    for (const planDoc of plans.docs) {
      const days = await planDoc.ref.collection('days').get();
      for (const dayDoc of days.docs) {
        const imgRef = dayDoc.ref.collection('images').doc(args.where.id);
        const imgDoc = await imgRef.get();
        if (imgDoc.exists) {
          await imgRef.delete();
          return { id: args.where.id };
        }
      }
    }
    return { id: args.where.id };
  },

  async deleteMany(args: { where: { tour_day_id: string } }): Promise<{ count: number }> {
    const dayId = args.where.tour_day_id;
    const day = await tourDayAdapter.findUnique({ where: { id: dayId } });
    if (!day) return { count: 0 };

    const snap = await adminDb.collection('tour_plans').doc(day.tour_plan_id).collection('days').doc(dayId).collection('images').get();
    for (const doc of snap.docs) {
      await doc.ref.delete();
    }
    return { count: snap.size };
  }
};

// ----------------------------------------------------
// TourCostItem Adapter
// ----------------------------------------------------
const tourCostItemAdapter = {
  async findMany(args?: { where?: any; orderBy?: any }): Promise<any[]> {
    return safeQuery(async () => {
      const planId = args?.where?.tour_plan_id;
      if (!planId) return [];
      const snap = await adminDb.collection('tour_plans').doc(planId).collection('cost_items').get();
      return snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
    }, []);
  },

  async create(args: { data: any }): Promise<any> {
    const id = args.data.id || generateId();
    const planId = args.data.tour_plan_id;
    const ref = adminDb.collection('tour_plans').doc(planId).collection('cost_items').doc(id);
    const data = { ...args.data, id, created_at: new Date(), updated_at: new Date() };
    await ref.set(data, { merge: true });
    return asObject(data);
  },

  async update(args: { where: { id: string }; data: any }): Promise<any> {
    const planId = args.data?.tour_plan_id;
    if (planId) {
      const ref = adminDb.collection('tour_plans').doc(planId).collection('cost_items').doc(args.where.id);
      await ref.set({ ...args.data, updated_at: new Date() }, { merge: true });
      const doc = await ref.get();
      return { id: doc.id, ...asObject(doc.data()) };
    }
    const plans = await adminDb.collection('tour_plans').get();
    for (const pDoc of plans.docs) {
      const ref = pDoc.ref.collection('cost_items').doc(args.where.id);
      const doc = await ref.get();
      if (doc.exists) {
        await ref.set({ ...args.data, updated_at: new Date() }, { merge: true });
        const updated = await ref.get();
        return { id: updated.id, ...asObject(updated.data()) };
      }
    }
    return null;
  },

  async delete(args: { where: { id: string } }): Promise<any> {
    const plans = await adminDb.collection('tour_plans').get();
    for (const pDoc of plans.docs) {
      const ref = pDoc.ref.collection('cost_items').doc(args.where.id);
      const doc = await ref.get();
      if (doc.exists) {
        await ref.delete();
        return { id: args.where.id };
      }
    }
    return { id: args.where.id };
  }
};

// ----------------------------------------------------
// TourCoverDesign Adapter
// ----------------------------------------------------
const tourCoverDesignAdapter = {
  async findFirst(args?: { where?: { tour_plan_id?: string }; orderBy?: any }): Promise<any | null> {
    return safeQuery(async () => {
      const planId = args?.where?.tour_plan_id;
      if (!planId) return null;
      const snap = await adminDb.collection('tour_plans').doc(planId).collection('covers').get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: doc.id, ...asObject(doc.data()) };
    }, null);
  },

  async create(args: { data: any }): Promise<any> {
    const id = args.data.id || generateId();
    const planId = args.data.tour_plan_id;
    const ref = adminDb.collection('tour_plans').doc(planId).collection('covers').doc(id);
    const now = new Date();
    const data = { ...args.data, id, created_at: now, updated_at: now };
    await ref.set(data, { merge: true });
    return asObject(data);
  },

  async update(args: { where: { id: string }; data: any }): Promise<any> {
    const planId = args.data?.tour_plan_id;
    if (planId) {
      const ref = adminDb.collection('tour_plans').doc(planId).collection('covers').doc(args.where.id);
      await ref.set({ ...args.data, updated_at: new Date() }, { merge: true });
      const doc = await ref.get();
      return { id: doc.id, ...asObject(doc.data()) };
    }
    const plans = await adminDb.collection('tour_plans').get();
    for (const pDoc of plans.docs) {
      const ref = pDoc.ref.collection('covers').doc(args.where.id);
      const doc = await ref.get();
      if (doc.exists) {
        await ref.set({ ...args.data, updated_at: new Date() }, { merge: true });
        const updated = await ref.get();
        return { id: updated.id, ...asObject(updated.data()) };
      }
    }
    return null;
  },

  async upsert(args: { where?: any; create: any; update: any }): Promise<any> {
    const planId = args.create?.tour_plan_id || args.update?.tour_plan_id;
    const existing = await this.findFirst({ where: { tour_plan_id: planId } });
    const id = existing?.id || generateId();
    const ref = adminDb.collection('tour_plans').doc(planId).collection('covers').doc(id);

    const now = new Date();
    const data = existing
      ? { ...args.update, updated_at: now }
      : { ...args.create, id, created_at: now, updated_at: now };

    await ref.set(data, { merge: true });
    const updated = await ref.get();
    return { id: updated.id, ...asObject(updated.data()) };
  }
};

// ----------------------------------------------------
// Main Prisma Compatibility Object Export
// ----------------------------------------------------
export const prisma = {
  customer: customerAdapter,
  tourPlan: tourPlanAdapter,
  tourDay: tourDayAdapter,
  tourActivity: tourActivityAdapter,
  tourDayImage: tourDayImageAdapter,
  tourCostItem: tourCostItemAdapter,
  tourCoverDesign: tourCoverDesignAdapter,

  hotel: {
    async findMany(args?: { where?: { tour_plan_id?: string } }) {
      const planId = args?.where?.tour_plan_id;
      if (!planId) return [];
      const snap = await adminDb.collection('tour_plans').doc(planId).collection('hotels').get();
      return snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
    },
    async create(args: { data: any }) {
      const id = args.data.id || generateId();
      const ref = adminDb.collection('tour_plans').doc(args.data.tour_plan_id).collection('hotels').doc(id);
      await ref.set({ ...args.data, id }, { merge: true });
      return { id, ...args.data };
    },
    async update(args: { where: { id: string }; data: any }) {
      const planId = args.data?.tour_plan_id;
      if (planId) {
        const ref = adminDb.collection('tour_plans').doc(planId).collection('hotels').doc(args.where.id);
        await ref.set(args.data, { merge: true });
        const doc = await ref.get();
        return { id: doc.id, ...asObject(doc.data()) };
      }
      return null;
    },
    async delete(args: { where: { id: string } }) {
      const plans = await adminDb.collection('tour_plans').get();
      for (const pDoc of plans.docs) {
        const ref = pDoc.ref.collection('hotels').doc(args.where.id);
        const doc = await ref.get();
        if (doc.exists) {
          await ref.delete();
          return { id: args.where.id };
        }
      }
      return { id: args.where.id };
    },
    async deleteMany(args: { where: { tour_plan_id: string } }) {
      const snap = await adminDb.collection('tour_plans').doc(args.where.tour_plan_id).collection('hotels').get();
      for (const d of snap.docs) await d.ref.delete();
      return { count: snap.size };
    }
  },

  inclusion: {
    async findMany(args?: { where?: { tour_plan_id?: string } }) {
      const planId = args?.where?.tour_plan_id;
      if (!planId) return [];
      const snap = await adminDb.collection('tour_plans').doc(planId).collection('inclusions').orderBy('sort_order', 'asc').get();
      return snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
    },
    async create(args: { data: any }) {
      const id = args.data.id || generateId();
      const ref = adminDb.collection('tour_plans').doc(args.data.tour_plan_id).collection('inclusions').doc(id);
      await ref.set({ ...args.data, id }, { merge: true });
      return { id, ...args.data };
    },
    async update(args: { where: { id: string }; data: any }) {
      const planId = args.data?.tour_plan_id;
      if (planId) {
        const ref = adminDb.collection('tour_plans').doc(planId).collection('inclusions').doc(args.where.id);
        await ref.set(args.data, { merge: true });
        const doc = await ref.get();
        return { id: doc.id, ...asObject(doc.data()) };
      }
      return null;
    },
    async delete(args: { where: { id: string } }) {
      const plans = await adminDb.collection('tour_plans').get();
      for (const pDoc of plans.docs) {
        const ref = pDoc.ref.collection('inclusions').doc(args.where.id);
        const doc = await ref.get();
        if (doc.exists) {
          await ref.delete();
          return { id: args.where.id };
        }
      }
      return { id: args.where.id };
    },
    async deleteMany(args: { where: { tour_plan_id: string } }) {
      const snap = await adminDb.collection('tour_plans').doc(args.where.tour_plan_id).collection('inclusions').get();
      for (const d of snap.docs) await d.ref.delete();
      return { count: snap.size };
    }
  },

  exclusion: {
    async findMany(args?: { where?: { tour_plan_id?: string } }) {
      const planId = args?.where?.tour_plan_id;
      if (!planId) return [];
      const snap = await adminDb.collection('tour_plans').doc(planId).collection('exclusions').orderBy('sort_order', 'asc').get();
      return snap.docs.map((d: any) => ({ id: d.id, ...asObject(d.data()) }));
    },
    async create(args: { data: any }) {
      const id = args.data.id || generateId();
      const ref = adminDb.collection('tour_plans').doc(args.data.tour_plan_id).collection('exclusions').doc(id);
      await ref.set({ ...args.data, id }, { merge: true });
      return { id, ...args.data };
    },
    async update(args: { where: { id: string }; data: any }) {
      const planId = args.data?.tour_plan_id;
      if (planId) {
        const ref = adminDb.collection('tour_plans').doc(planId).collection('exclusions').doc(args.where.id);
        await ref.set(args.data, { merge: true });
        const doc = await ref.get();
        return { id: doc.id, ...asObject(doc.data()) };
      }
      return null;
    },
    async delete(args: { where: { id: string } }) {
      const plans = await adminDb.collection('tour_plans').get();
      for (const pDoc of plans.docs) {
        const ref = pDoc.ref.collection('exclusions').doc(args.where.id);
        const doc = await ref.get();
        if (doc.exists) {
          await ref.delete();
          return { id: args.where.id };
        }
      }
      return { id: args.where.id };
    },
    async deleteMany(args: { where: { tour_plan_id: string } }) {
      const snap = await adminDb.collection('tour_plans').doc(args.where.tour_plan_id).collection('exclusions').get();
      for (const d of snap.docs) await d.ref.delete();
      return { count: snap.size };
    }
  },

  tourVersion: {
    async create(args: { data: any }) {
      const id = args.data.id || generateId();
      const ref = adminDb.collection('tour_plans').doc(args.data.tour_plan_id).collection('versions').doc(id);
      const data = { ...args.data, id, created_at: new Date() };
      await ref.set(data, { merge: true });
      return asObject(data);
    }
  }
};
