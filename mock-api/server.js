const express = require('express');
const cors = require('cors');
const {
  families,
  children,
  vaccines,
  vaccineDoses,
  vaccineApplications,
  vaccinationCampaigns,
  campaignVaccines,
  preVaccinationMaps,
} = require('./data');

const app = express();
const PORT = process.env.MOCK_API_PORT || 3333;

app.use(cors());
app.use(express.json());

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizeDateOnly(value) {
  return new Date(`${value}T00:00:00Z`);
}

function getAgeInMonths(birthDate) {
  const now = new Date();
  const birth = normalizeDateOnly(birthDate);

  const yearDiff = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = now.getUTCDate() - birth.getUTCDate();

  let total = yearDiff * 12 + monthDiff;
  if (dayDiff < 0) {
    total -= 1;
  }

  return Math.max(total, 0);
}

function getApplicationStatus(application) {
  if (application.appliedDate) {
    return 'APPLIED';
  }

  const today = normalizeDateOnly(new Date().toISOString().slice(0, 10));
  const scheduled = normalizeDateOnly(application.scheduledDate);

  if (scheduled < today) {
    return 'OVERDUE';
  }

  return 'PENDING';
}

function hydrateApplication(application) {
  const dose = vaccineDoses.find((item) => item.id === application.vaccineDoseId);
  const vaccine = dose ? vaccines.find((item) => item.id === dose.vaccineId) : null;
  const preMap = application.preVaccinationMapId
    ? preVaccinationMaps.find((item) => item.id === application.preVaccinationMapId)
    : null;
  const campaign = application.campaignId
    ? vaccinationCampaigns.find((item) => item.id === application.campaignId)
    : null;

  return {
    ...application,
    status: getApplicationStatus(application),
    vaccineName: vaccine ? vaccine.name : null,
    vaccineId: vaccine ? vaccine.id : null,
    doseNumber: dose ? dose.doseNumber : null,
    preVaccinationRecommendation: preMap ? preMap.recommendation : null,
    campaignTitle: campaign ? campaign.title : null,
  };
}

function getChildApplications(childId) {
  return vaccineApplications
    .filter((item) => item.childId === childId)
    .map(hydrateApplication)
    .sort((a, b) => normalizeDateOnly(a.scheduledDate) - normalizeDateOnly(b.scheduledDate));
}

function summarizeStatus(applications) {
  return applications.reduce(
    (acc, item) => {
      acc.total += 1;
      acc[item.status] += 1;
      return acc;
    },
    {
      total: 0,
      APPLIED: 0,
      PENDING: 0,
      OVERDUE: 0,
    }
  );
}

function childWithSituation(child) {
  const applications = getChildApplications(child.id);
  const statusSummary = summarizeStatus(applications);

  let vaccinationSituation = 'APPLIED';
  if (statusSummary.OVERDUE > 0) {
    vaccinationSituation = 'OVERDUE';
  } else if (statusSummary.PENDING > 0) {
    vaccinationSituation = 'PENDING';
  }

  return {
    ...child,
    ageMonths: getAgeInMonths(child.birthDate),
    vaccinationSituation,
    statusSummary,
  };
}

function campaignWithMeta(campaign) {
  const today = normalizeDateOnly(new Date().toISOString().slice(0, 10));
  const start = normalizeDateOnly(campaign.startDate);
  const end = normalizeDateOnly(campaign.endDate);

  const vaccineIds = campaignVaccines
    .filter((item) => item.campaignId === campaign.id)
    .map((item) => item.vaccineId);

  const vaccinesInCampaign = vaccines.filter((item) => vaccineIds.includes(item.id));

  return {
    ...campaign,
    active: start <= today && today <= end,
    remainingDays: Math.max(Math.ceil((end - today) / MS_PER_DAY), 0),
    vaccines: vaccinesInCampaign,
  };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'mock-api', port: PORT });
});

app.get('/families', (_req, res) => {
  const parsed = families.map((family) => {
    const familyChildren = children
      .filter((item) => item.familyId === family.id)
      .map((item) => childWithSituation(item));

    return {
      ...family,
      childrenCount: familyChildren.length,
      children: familyChildren,
    };
  });

  res.json(parsed);
});

app.get('/families/:familyId', (req, res) => {
  const family = families.find((item) => item.id === req.params.familyId);

  if (!family) {
    return res.status(404).json({ message: 'Familia nao encontrada.' });
  }

  const familyChildren = children
    .filter((item) => item.familyId === family.id)
    .map((item) => childWithSituation(item));

  return res.json({
    ...family,
    childrenCount: familyChildren.length,
    children: familyChildren,
  });
});

app.get('/families/:familyId/children', (req, res) => {
  const family = families.find((item) => item.id === req.params.familyId);

  if (!family) {
    return res.status(404).json({ message: 'Familia nao encontrada.' });
  }

  const familyChildren = children
    .filter((item) => item.familyId === req.params.familyId)
    .map((item) => childWithSituation(item));

  return res.json(familyChildren);
});

app.get('/children', (req, res) => {
  const { familyId, status } = req.query;

  let parsed = children.map((item) => childWithSituation(item));

  if (familyId) {
    parsed = parsed.filter((item) => item.familyId === familyId);
  }

  if (status) {
    parsed = parsed.filter((item) => item.vaccinationSituation === status);
  }

  return res.json(parsed);
});

app.get('/children/:childId', (req, res) => {
  const child = children.find((item) => item.id === req.params.childId);

  if (!child) {
    return res.status(404).json({ message: 'Crianca nao encontrada.' });
  }

  return res.json(childWithSituation(child));
});

app.put('/children/:childId', (req, res) => {
  const child = children.find((item) => item.id === req.params.childId);

  if (!child) {
    return res.status(404).json({ message: 'Crianca nao encontrada.' });
  }

  const { name, birthDate, gender } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ message: 'Nome invalido.' });
  }

  if (!birthDate || Number.isNaN(normalizeDateOnly(birthDate).getTime())) {
    return res.status(400).json({ message: 'Data de nascimento invalida.' });
  }

  if (!['M', 'F'].includes(gender)) {
    return res.status(400).json({ message: 'Genero invalido.' });
  }

  child.name = name.trim();
  child.birthDate = birthDate;
  child.gender = gender;

  return res.json(childWithSituation(child));
});

app.get('/children/:childId/vaccination-history', (req, res) => {
  const child = children.find((item) => item.id === req.params.childId);

  if (!child) {
    return res.status(404).json({ message: 'Crianca nao encontrada.' });
  }

  const { status } = req.query;
  let records = getChildApplications(req.params.childId);

  if (status) {
    records = records.filter((item) => item.status === status);
  }

  return res.json(records);
});

app.get('/children/:childId/vaccination-situation', (req, res) => {
  const child = children.find((item) => item.id === req.params.childId);

  if (!child) {
    return res.status(404).json({ message: 'Crianca nao encontrada.' });
  }

  const applications = getChildApplications(req.params.childId);
  const summary = summarizeStatus(applications);
  const nextDue = applications.find((item) => item.status !== 'APPLIED') || null;

  return res.json({
    child: childWithSituation(child),
    summary,
    nextDue,
    overdueItems: applications.filter((item) => item.status === 'OVERDUE'),
    pendingItems: applications.filter((item) => item.status === 'PENDING'),
  });
});

app.get('/children/:childId/pre-vaccination-map', (req, res) => {
  const child = children.find((item) => item.id === req.params.childId);

  if (!child) {
    return res.status(404).json({ message: 'Crianca nao encontrada.' });
  }

  const records = preVaccinationMaps
    .filter((item) => item.childId === req.params.childId)
    .map((item) => {
      const dose = vaccineDoses.find((doseItem) => doseItem.id === item.vaccineDoseId);
      const vaccine = dose ? vaccines.find((vacItem) => vacItem.id === dose.vaccineId) : null;

      return {
        ...item,
        vaccineName: vaccine ? vaccine.name : null,
        doseNumber: dose ? dose.doseNumber : null,
      };
    });

  return res.json(records);
});

app.get('/vaccines', (_req, res) => {
  return res.json(vaccines);
});

app.get('/vaccine-doses', (_req, res) => {
  const parsed = vaccineDoses.map((dose) => {
    const vaccine = vaccines.find((item) => item.id === dose.vaccineId);
    return {
      ...dose,
      vaccineName: vaccine ? vaccine.name : null,
    };
  });

  return res.json(parsed);
});

app.get('/campaigns', (_req, res) => {
  return res.json(vaccinationCampaigns.map((item) => campaignWithMeta(item)));
});

app.get('/campaigns/active', (req, res) => {
  const { childId } = req.query;

  let active = vaccinationCampaigns
    .map((item) => campaignWithMeta(item))
    .filter((item) => item.active);

  if (childId) {
    const child = children.find((item) => item.id === childId);

    if (!child) {
      return res.status(404).json({ message: 'Crianca nao encontrada.' });
    }

    const ageMonths = getAgeInMonths(child.birthDate);
    active = active.filter((item) => {
      const min = item.targetMinAgeMonths ?? 0;
      const max = item.targetMaxAgeMonths ?? 999;
      return ageMonths >= min && ageMonths <= max;
    });
  }

  return res.json(active);
});

app.get('/dashboard', (_req, res) => {
  const parsedChildren = children.map((item) => childWithSituation(item));
  const childApplications = vaccineApplications.map((item) => hydrateApplication(item));

  return res.json({
    totals: {
      families: families.length,
      children: parsedChildren.length,
      applied: childApplications.filter((item) => item.status === 'APPLIED').length,
      pending: childApplications.filter((item) => item.status === 'PENDING').length,
      overdue: childApplications.filter((item) => item.status === 'OVERDUE').length,
      activeCampaigns: vaccinationCampaigns
        .map((item) => campaignWithMeta(item))
        .filter((item) => item.active).length,
    },
    childrenBySituation: {
      APPLIED: parsedChildren.filter((item) => item.vaccinationSituation === 'APPLIED').length,
      PENDING: parsedChildren.filter((item) => item.vaccinationSituation === 'PENDING').length,
      OVERDUE: parsedChildren.filter((item) => item.vaccinationSituation === 'OVERDUE').length,
    },
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Rota nao encontrada na mock API.' });
});

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
