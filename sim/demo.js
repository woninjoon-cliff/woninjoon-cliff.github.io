(() => {
  // env.mjs
  globalThis.Deno = { env: { get: () => "http://db.test" } };

  // ../../../../../../home/claude/webapp/sim/fake-db.mjs
  var \uD0A4\uCE78 = { \uC2DC\uBBAC\uC124\uC815: ["\uD0A4"], \uD68C\uC6D0\uAD8C\uC2DC\uB098\uB9AC\uC624: ["\uC2DC\uB098\uB9AC\uC624ID"] };
  function \uAC00\uC9DC\uB514\uBE44(\uD45C3, rpc2) {
    let \uB2E4\uC74C\uC548ID = 1;
    const \uB9DE\uB098 = (r, k, \uC2DD) => {
      const [, \uC5F0\uC0B0, \uAC12] = /^(eq|gte|lt|is|in)\.(.*)$/s.exec(\uC2DD) || [];
      const \uCE78 = r[k] ?? null, \uAE002 = String(\uCE78 ?? "");
      if (\uC5F0\uC0B0 === "eq") return \uAE002 === \uAC12;
      if (\uC5F0\uC0B0 === "gte") return \uAE002 >= \uAC12;
      if (\uC5F0\uC0B0 === "lt") return \uAE002 < \uAC12;
      if (\uC5F0\uC0B0 === "is") return String(\uCE78) === \uAC12;
      if (\uC5F0\uC0B0 === "in") return \uAC12.slice(1, -1).split(",").includes(\uAE002);
      throw new Error(`\uAC00\uC9DC\uB514\uBE44\uAC00 \uBAA8\uB974\uB294 \uC870\uAC74: ${k}=${\uC2DD}`);
    };
    const \uB2F5 = (\uBAB8, status = 200) => new Response(\uBAB8 === void 0 ? "" : JSON.stringify(\uBAB8), { status });
    return async (\uC8FC\uC18C, opt = {}) => {
      const url = new URL(\uC8FC\uC18C), \uAE38 = decodeURIComponent(url.pathname).replace(/^\/rest\/v1\//, "");
      if (\uAE38.startsWith("rpc/")) return \uB2F5(rpc2(\uAE38.slice(4), JSON.parse(opt.body || "{}")));
      const \uBC29\uBC95 = opt.method || "GET", \uC120\uD638 = new Headers(opt.headers).get("Prefer") || "";
      const \uB3CC\uB824\uC90C = \uC120\uD638.includes("return=representation"), \uC904\uB4E4 = \uD45C3[\uAE38] ||= [];
      if (\uBC29\uBC95 === "POST") {
        const \uC0C8\uAC83 = [].concat(JSON.parse(opt.body)), \uD0A4 = \uD0A4\uCE78[\uAE38];
        const \uAC19\uC740 = (n) => \uD0A4 && \uC904\uB4E4.find((r) => \uD0A4.every((c) => r[c] === n[c]));
        if (!\uC120\uD638.includes("merge-duplicates") && \uC0C8\uAC83.some(\uAC19\uC740)) return \uB2F5({ message: "duplicate key value" }, 409);
        const \uB123\uC740 = \uC0C8\uAC83.map((n) => {
          const \uC788\uB358 = \uAC19\uC740(n);
          if (\uC788\uB358) return Object.assign(\uC788\uB358, n);
          const \uC904 = {
            ...\uAE38 === "\uB9C8\uCF00\uD305\uC548" ? { \uC548ID: \uB2E4\uC74C\uC548ID++ } : {},
            ...\uAE38 === "\uB9C8\uCF00\uD305\uB85C\uADF8\uC778\uC2E4\uD328" ? { \uBC88\uD638: \uB2E4\uC74C\uC548ID++, \uC2DC\uAC01: new Date(Date.now()).toISOString() } : {},
            ...n
          };
          \uC904\uB4E4.push(\uC904);
          return \uC904;
        });
        return \uB2F5(\uB3CC\uB824\uC90C ? \uB123\uC740 : void 0, 201);
      }
      const \uAC78\uB9B0 = \uC904\uB4E4.filter((r) => [...url.searchParams].every(([k, \uC2DD]) => ["select", "order", "limit"].includes(k) || \uB9DE\uB098(r, k, \uC2DD)));
      if (\uBC29\uBC95 === "PATCH") {
        \uAC78\uB9B0.forEach((r) => Object.assign(r, JSON.parse(opt.body)));
        return \uB2F5(\uB3CC\uB824\uC90C ? \uAC78\uB9B0 : void 0);
      }
      if (\uBC29\uBC95 === "DELETE") {
        \uD45C3[\uAE38] = \uC904\uB4E4.filter((r) => !\uAC78\uB9B0.includes(r));
        return \uB2F5(\uB3CC\uB824\uC90C ? \uAC78\uB9B0 : void 0);
      }
      const \uCE78\uB4E4 = (url.searchParams.get("select") || "").split(",").filter(Boolean);
      const [\uC815\uB82C\uCE78] = (url.searchParams.get("order") || "").split(".");
      const \uC815\uB82C = \uC815\uB82C\uCE78 ? [...\uAC78\uB9B0].sort((a, b) => String(a[\uC815\uB82C\uCE78]).localeCompare(String(b[\uC815\uB82C\uCE78]), "en", { numeric: true })) : \uAC78\uB9B0;
      return \uB2F5(\uC815\uB82C.slice(0, Number(url.searchParams.get("limit")) || Infinity).map((r) => \uCE78\uB4E4.length ? Object.fromEntries(\uCE78\uB4E4.map((k) => [k, r[k] ?? null])) : { ...r }));
    };
  }

  // demo-fixture.mjs
  var \uC624\uB298 = "2026-10-13";
  var \uB2EC\uD589 = [["2025-10", "et", 14, 7, 8292e3], ["2025-10", "hx", 13, 10, 33336e3], ["2025-10", "kr", 56, 45, 55866e3], ["2025-10", "ss", 119, 106, 29316e4], ["2025-11", "et", 19, 11, 13959e3], ["2025-11", "hx", 12, 11, 40529e3], ["2025-11", "kr", 45, 40, 67146e3], ["2025-11", "ss", 191, 158, 428339e3], ["2025-12", "et", 27, 17, 27863e3], ["2025-12", "hx", 19, 12, 39813e3], ["2025-12", "kr", 42, 39, 43789e3], ["2025-12", "ss", 204, 180, 509761e3], ["2026-01", "et", 20, 13, 17834e3], ["2026-01", "hx", 35, 19, 28783e3], ["2026-01", "kr", 77, 67, 94134e3], ["2026-01", "ss", 159, 138, 382136e3], ["2026-02", "et", 25, 16, 23142e3], ["2026-02", "hx", 16, 6, 10647e3], ["2026-02", "et", 1, 1, 588e3], ["2026-02", "kr", 68, 61, 69905e3], ["2026-02", "ss", 123, 107, 32116e4], ["2026-03", "et", 25, 15, 14907e3], ["2026-03", "hx", 23, 13, 29677e3], ["2026-03", "kr", 90, 72, 83464e3], ["2026-03", "ss", 112, 97, 295742e3], ["2026-04", "et", 28, 16, 18928e3], ["2026-04", "hx", 25, 15, 27947e3], ["2026-04", "et", 1, 1, 2143e3], ["2026-04", "kr", 101, 80, 78351e3], ["2026-04", "ss", 185, 160, 429397e3], ["2026-05", "et", 23, 14, 15223e3], ["2026-05", "hx", 21, 18, 32035e3], ["2026-05", "kr", 98, 83, 7889e4], ["2026-05", "ss", 248, 213, 611626e3], ["2026-06", "et", 18, 11, 9993e3], ["2026-06", "hx", 26, 17, 26574e3], ["2026-06", "kr", 93, 82, 74356e3], ["2026-06", "ss", 233, 202, 567763e3], ["2026-07", "et", 8, 6, 8866e3], ["2026-07", "hx", 15, 10, 21289e3], ["2026-07", "kr", 88, 83, 65353e3], ["2026-07", "ss", 215, 191, 465067e3], ["2026-08", "et", 8, 6, 3932e3], ["2026-08", "hx", 6, 5, 8995e3], ["2026-08", "et", 3, 3, 2803e3], ["2026-08", "kr", 28, 25, 23622e3], ["2026-08", "pf", 12, 12, 2238e3], ["2026-08", "ss", 239, 222, 552268e3], ["2026-09", "et", 3, 1, 19e4], ["2026-09", "hx", 14, 13, 24908e3], ["2026-09", "et", 1, 1, 346e3], ["2026-09", "kr", 49, 45, 44496e3], ["2026-09", "pf", 11, 11, 2236e3], ["2026-09", "ss", 134, 121, 341596e3], ["2026-10", "et", 1, 0, 0], ["2026-10", "hx", 6, 3, 5163e3], ["2026-10", "et", 1, 1, 41e3], ["2026-10", "kr", 34, 32, 25738e3], ["2026-10", "pf", 8, 8, 1276e3], ["2026-10", "ss", 98, 92, 190809e3]].map(([\uC5F0\uC6D4, \uCC44\uB110, \uC0C1\uB2F4, \uACB0\uC81C, \uB9E4\uCD9C]) => ({ \uC5F0\uC6D4, \uCC44\uB110, \uC0C1\uB2F4, \uACB0\uC81C, \uB9E4\uCD9C }));
  var \uBAA9\uD45C = { "2026-08": 6e8, "2026-09": 6e8, "2026-10": 6e8 };
  var \uD45C = () => ({
    \uBCD1\uC6D0: [{ \uBCD1\uC6D0ID: "H001", \uBCD1\uC6D0\uBA85: "\uB370\uBAA8 \uD53C\uBD80\uACFC", \uD734\uBB34\uC694\uC77C: "\uC77C", \uC0AC\uC6A9\uC5EC\uBD80: true }],
    \uAE30\uC900\uC815\uBCF4: Object.entries(\uBAA9\uD45C).map(([\uAC12, \uAE08\uC561], i) => ({ \uAE30\uC900ID: "B" + i, \uBCD1\uC6D0ID: "H001", \uAD6C\uBD84: "\uC6D4\uBAA9\uD45C", \uAC12, \uBE44\uACE0: \uAE08\uC561.toLocaleString("en-US"), \uC0AC\uC6A9\uC5EC\uBD80: true })),
    \uB9C8\uCF00\uD305\uC548: [{ "\uC548ID": 1001, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "4\uC6D4 \uC2E4\uC801", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uC2E4\uC801", "\uB2EC": "2026-04", "\uAE30\uC900": null, "\uBA54\uBAA8": "", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 556766e3, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 18e6, "db": 562, "cpa": 32e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 12e6, "db": 292, "cpa": 41e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 6e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 9e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 3e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 76, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 179, "\uC778": 42, "\uC6D0\uB0B4": 119 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0, "\uC778\uB960": 0, "\uC6D0\uB0B4": 0, "\uB2E8\uAC00": 0, "\uAE30\uC900\uC77C": 0 } } }, { "\uC548ID": 1002, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "5\uC6D4 \uC2E4\uC801", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uC2E4\uC801", "\uB2EC": "2026-05", "\uAE30\uC900": null, "\uBA54\uBAA8": "", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 737774e3, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 26e6, "db": 866, "cpa": 3e4, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 15e6, "db": 375, "cpa": 4e4, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 7e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 1e7, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 35e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 0, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 261, "\uC778": 0, "\uC6D0\uB0B4": 137 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0, "\uC778\uB960": 0, "\uC6D0\uB0B4": 0, "\uB2E8\uAC00": 0, "\uAE30\uC900\uC77C": 0 } } }, { "\uC548ID": 1003, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "6\uC6D4 \uC2E4\uC801", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uC2E4\uC801", "\uB2EC": "2026-06", "\uAE30\uC900": null, "\uBA54\uBAA8": "", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 678686e3, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 23e6, "db": 696, "cpa": 33e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 14e6, "db": 325, "cpa": 43e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 65e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 95e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 32e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 47, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 214, "\uC778": 26, "\uC6D0\uB0B4": 130 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0, "\uC778\uB960": 0, "\uC6D0\uB0B4": 0, "\uB2E8\uAC00": 0, "\uAE30\uC900\uC77C": 0 } } }, { "\uC548ID": 1004, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "7\uC6D4 \uC2E4\uC801", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uC2E4\uC801", "\uB2EC": "2026-07", "\uAE30\uC900": null, "\uBA54\uBAA8": "", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 560575e3, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 17e6, "db": 472, "cpa": 36e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 11e6, "db": 250, "cpa": 44e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 6e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 9e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 28e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 109, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 152, "\uC778": 60, "\uC6D0\uB0B4": 114 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0, "\uC778\uB960": 0, "\uC6D0\uB0B4": 0, "\uB2E8\uAC00": 0, "\uAE30\uC900\uC77C": 0 } } }, { "\uC548ID": 1005, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "8\uC6D4 \uC2E4\uC801", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uC2E4\uC801", "\uB2EC": "2026-08", "\uAE30\uC900": null, "\uBA54\uBAA8": "", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 593858e3, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 19e6, "db": 558, "cpa": 34e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 1e7, "db": 217, "cpa": 46e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 9e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 11e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 3e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 53, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 163, "\uC778": 29, "\uC6D0\uB0B4": 104 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0, "\uC778\uB960": 0, "\uC6D0\uB0B4": 0, "\uB2E8\uAC00": 0, "\uAE30\uC900\uC77C": 0 } } }, { "\uC548ID": 1006, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "9\uC6D4 \uC2E4\uC801", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uC2E4\uC801", "\uB2EC": "2026-09", "\uAE30\uC900": null, "\uBA54\uBAA8": "", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 413772e3, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 11e6, "db": 289, "cpa": 38e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 7e6, "db": 145, "cpa": 48e3, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 5e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 8e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 25e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 85, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 91, "\uC778": 47, "\uC6D0\uB0B4": 74 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0, "\uC778\uB960": 0, "\uC6D0\uB0B4": 0, "\uB2E8\uAC00": 0, "\uAE30\uC900\uC77C": 0 } } }, { "\uC548ID": 1007, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "A\uC548", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uACC4\uD68D", "\uB2EC": "2026-10", "\uAE30\uC900": null, "\uBA54\uBAA8": "\uCD5C\uADFC 3\uB2EC \uD3C9\uADE0", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 0, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 11e6, "db": 308, "cpa": 35633.0553449583, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 7e6, "db": 153, "cpa": 45751.63398692811, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 5e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 8e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 25e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 82, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 0, "\uC778": 0, "\uC6D0\uB0B4": 0 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0.21017543859649124, "\uC778\uB960": 0.5501899011292244, "\uC6D0\uB0B4": 97, "\uB2E8\uAC00": 1.8925289862440284e6, "\uAE30\uC900\uC77C": 25 } } }, { "\uC548ID": 1008, "\uBCD1\uC6D0ID": "H001", "\uC774\uB984": "B\uC548", "\uC218\uC815\uC77C\uC2DC": "2026-10-13T03:00:00.000Z", "\uAC12": { "\uC885\uB958": "\uACC4\uD68D", "\uB2EC": "2026-10", "\uAE30\uC900": null, "\uBA54\uBAA8": "CPA \uAD11\uACE0 \uB298\uB9BC", "\uC601\uC5C5\uC77C": 25, "\uC2DC\uC220": 0, "\uC678": 0, "\uD56D\uBAA9": [{ "\uC774\uB984": "CPA \uAD11\uACE0 A", "\uC885\uB958": "DB", "\uAE08\uC561": 15399999999999998e-9, "db": 432, "cpa": 35633.0553449583, "\uC148\uCE78": "db" }, { "\uC774\uB984": "CPA \uAD11\uACE0 B", "\uC885\uB958": "DB", "\uAE08\uC561": 98e5, "db": 214, "cpa": 45751.63398692811, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uC571 \uD3EC\uC778\uD2B8", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 5e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uBC14\uC774\uB7F4", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 8e6, "db": 0, "cpa": null, "\uC148\uCE78": "db" }, { "\uC774\uB984": "\uAC80\uC0C9 \uAD11\uACE0", "\uC885\uB958": "\uADF8\uBC16", "\uAE08\uC561": 25e5, "db": 0, "cpa": null, "\uC148\uCE78": "db" }], "\uC778DB": 82, "\uCD94\uAC00DB": 0, "\uC0C1\uB2F4": { "\uC544\uC6C3": 0, "\uC778": 0, "\uC6D0\uB0B4": 0 }, "\uC804\uD658": { "\uC544\uC6C3\uB960": 0.21017543859649124, "\uC778\uB960": 0.5501899011292244, "\uC6D0\uB0B4": 97, "\uB2E8\uAC00": 1.8925289862440284e6, "\uAE30\uC900\uC77C": 25 } } }],
    // seed.mjs 로 만든 연습용 실적 6달 + 10월 A·B안
    \uB9C8\uCF00\uD305\uB85C\uADF8\uC778\uC2E4\uD328: [],
    \uD68C\uC6D0\uAD8C\uC2DC\uB098\uB9AC\uC624: [],
    \uC2DC\uBBAC\uC124\uC815: [
      { \uD0A4: "\uD68C\uC6D0\uAD8C\uAE30\uBCF8\uC2DC\uC220", \uAC12: JSON.stringify({ \uAD6C\uC6D4\uC804\uCCB4: 900, \uC2DC\uC220: [
        { name: "\uC608\uC2DC \uC2DC\uC220 A", list: 3e5, price: 2e5, cost: 11e4, lim: 0, w: 200, src: "\uB370\uBAA8" },
        { name: "\uC608\uC2DC \uC2DC\uC220 B", list: 9e5, price: 65e4, cost: 38e4, lim: 0, w: 120, src: "\uB370\uBAA8" },
        { name: "\uC608\uC2DC \uC2DC\uC220 C", list: 15e5, price: 11e5, cost: 7e5, lim: 0, w: 60, src: "\uB370\uBAA8" }
      ] }) }
    ]
  });
  var rpc = (\uC774\uB984, \uC778\uC790) => {
    if (\uC774\uB984 !== "mkt_month_total" || \uC778\uC790.p_hosp !== "H001") return [];
    const \uD569 = {};
    for (const r of \uB2EC\uD589) {
      if (r.\uC5F0\uC6D4 < \uC778\uC790.p_from.slice(0, 7) || r.\uC5F0\uC6D4 > \uC778\uC790.p_to.slice(0, 7)) continue;
      const o = \uD569[r.\uC5F0\uC6D4] ??= { \uC5F0\uC6D4: r.\uC5F0\uC6D4, \uC0C1\uB2F4: 0, \uACB0\uC81C: 0, \uB9E4\uCD9C: 0 };
      o.\uC0C1\uB2F4 += r.\uC0C1\uB2F4;
      o.\uACB0\uC81C += r.\uACB0\uC81C;
      o.\uB9E4\uCD9C += r.\uB9E4\uCD9C;
    }
    return Object.values(\uD569);
  };

  // ../../../../../../home/claude/webapp/supabase/functions/rpc/jwt.ts
  var b64url\uB514\uCF54\uB4DC = (s) => {
    const p = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4);
    return Uint8Array.from(atob(p), (c) => c.charCodeAt(0));
  };
  async function \uAC80\uC99D(\uD1A0\uD070, \uBE44\uBC00) {
    const \uC870\uAC01 = \uD1A0\uD070.split(".");
    if (\uC870\uAC01.length !== 3) throw new Error("\uD1A0\uD070 \uD615\uC2DD\uC774 \uC544\uB2C8\uB2E4");
    const [h, p, s] = \uC870\uAC01;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(\uBE44\uBC00),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const \uD1B5\uACFC = await crypto.subtle.verify(
      "HMAC",
      key,
      b64url\uB514\uCF54\uB4DC(s),
      new TextEncoder().encode(h + "." + p)
    );
    if (!\uD1B5\uACFC) throw new Error("\uC11C\uBA85\uC774 \uB9DE\uC9C0 \uC54A\uB294\uB2E4");
    const \uD074 = JSON.parse(new TextDecoder().decode(b64url\uB514\uCF54\uB4DC(p)));
    if (!\uD074.\uBCD1\uC6D0ID) throw new Error("\uBCD1\uC6D0ID \uD074\uB808\uC784\uC774 \uC5C6\uB2E4");
    if (typeof \uD074.exp !== "number") throw new Error("exp \uD074\uB808\uC784\uC774 \uC5C6\uB2E4");
    if (\uD074.exp <= Math.floor(Date.now() / 1e3)) throw new Error("\uD1A0\uD070\uC774 \uB9CC\uB8CC\uB418\uC5C8\uB2E4");
    return \uD074;
  }
  async function \uC11C\uBA85(\uD074, \uBE44\uBC00) {
    const b64url\uC778\uCF54\uB4DC = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const \uC55E = b64url\uC778\uCF54\uB4DC(JSON.stringify({ alg: "HS256", typ: "JWT" })) + "." + b64url\uC778\uCF54\uB4DC(JSON.stringify(\uD074));
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(\uBE44\uBC00),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const \uC11C = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(\uC55E));
    const \uAF2C\uB9AC = btoa(String.fromCharCode(...new Uint8Array(\uC11C))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return \uC55E + "." + \uAF2C\uB9AC;
  }

  // ../../../../../../home/claude/webapp/supabase/functions/rpc/lib.ts
  var URL_ = Deno.env.get("SUPABASE_URL");
  var KEY_ = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  async function \uC9C8\uC758(\uD568\uC218, \uC778\uC790) {
    const r = await fetch(`${URL_}/rest/v1/rpc/${\uD568\uC218}`, {
      method: "POST",
      headers: {
        apikey: KEY_,
        Authorization: `Bearer ${KEY_}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(\uC778\uC790)
    });
    if (!r.ok) throw new Error(`${\uD568\uC218} \uC9C8\uC758 \uC2E4\uD328 ${r.status} ${await r.text()}`);
    return await r.json();
  }
  var \uAE00 = (v) => String(v ?? "");
  function \uC624\uB298KST() {
    return new Date(Date.now() + 9 * 3600 * 1e3).toISOString().slice(0, 10);
  }
  async function \uC0BD\uC785(\uD45C3, \uD589) {
    const r = await fetch(`${URL_}/rest/v1/${encodeURIComponent(\uD45C3)}`, {
      method: "POST",
      headers: {
        apikey: KEY_,
        Authorization: `Bearer ${KEY_}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(\uD589)
    });
    if (!r.ok) throw new Error(`${\uD45C3} \uC800\uC7A5 \uC2E4\uD328 ${r.status} ${await r.text()}`);
    const \uB123\uC740 = (await r.json())[0];
    if (!\uB123\uC740) throw new Error(`${\uD45C3} \uC800\uC7A5 \uACB0\uACFC\uAC00 \uBE44\uC5C8\uB2E4`);
    return \uB123\uC740;
  }
  async function \uAC31\uC2E0(\uD45C3, \uC870\uAC74, \uBCC0\uACBD) {
    const q = Object.keys(\uC870\uAC74).map((k) => `${encodeURIComponent(k)}=eq.${encodeURIComponent(\uC870\uAC74[k])}`).join("&");
    const r = await fetch(`${URL_}/rest/v1/${encodeURIComponent(\uD45C3)}?${q}`, {
      method: "PATCH",
      headers: {
        apikey: KEY_,
        Authorization: `Bearer ${KEY_}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify(\uBCC0\uACBD)
    });
    if (!r.ok) throw new Error(`${\uD45C3} \uC218\uC815 \uC2E4\uD328 ${r.status} ${await r.text()}`);
    return await r.json();
  }
  function \uAC19\uC740\uAC00(a, b) {
    if (a.length !== b.length) return false;
    let \uCC28 = 0;
    for (let i = 0; i < a.length; i++) \uCC28 |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return \uCC28 === 0;
  }
  var \uBE44\uBC88\uBC18\uBCF5 = 1e5;
  var b64 = (u) => btoa(String.fromCharCode(...u));
  async function pbkdf2(\uD3C9\uBB38, \uC18C\uAE08, \uBC18\uBCF5) {
    const \uC5F4\uC1E0 = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(\uD3C9\uBB38),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const \uBE44\uD2B8 = await crypto.subtle.deriveBits(
      { name: "PBKDF2", hash: "SHA-256", salt: \uC18C\uAE08, iterations: \uBC18\uBCF5 },
      \uC5F4\uC1E0,
      256
    );
    return b64(new Uint8Array(\uBE44\uD2B8));
  }
  var \uBE44\uBC00\uBC88\uD638\uD5DB\uAC12 = "pbkdf2$" + \uBE44\uBC88\uBC18\uBCF5 + "$" + "A".repeat(22) + "==$" + "A".repeat(43) + "=";
  async function \uBE44\uBC00\uBC88\uD638\uB9CC\uB4E4\uAE30(\uD3C9\uBB38) {
    const \uC18C\uAE08 = crypto.getRandomValues(new Uint8Array(16));
    return "pbkdf2$" + \uBE44\uBC88\uBC18\uBCF5 + "$" + b64(\uC18C\uAE08) + "$" + await pbkdf2(\uD3C9\uBB38, \uC18C\uAE08, \uBE44\uBC88\uBC18\uBCF5);
  }
  async function \uBE44\uBC00\uBC88\uD638\uB9DE\uB098(\uD3C9\uBB38, \uC800\uC7A5\uAC12) {
    const s = \uAE00(\uC800\uC7A5\uAC12).trim();
    const [\uAF34, \uBC18\uBCF5, \uC18C\uAE08, \uAC12] = s.split("$");
    if (\uAF34 === "pbkdf2" && \uAC12) {
      const \uACC4\uC0B0 = await pbkdf2(\uD3C9\uBB38, Uint8Array.from(atob(\uC18C\uAE08), (c) => c.charCodeAt(0)), Number(\uBC18\uBCF5));
      return { \uB9DE\uC74C: \uAC19\uC740\uAC00(\uACC4\uC0B0, \uAC12), \uC61B\uAF34: Number(\uBC18\uBCF5) < \uBE44\uBC88\uBC18\uBCF5 };
    }
    const \uC61B = [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(\uD3C9\uBB38)))].map((b) => b.toString(16).padStart(2, "0")).join("");
    return { \uB9DE\uC74C: \uAC19\uC740\uAC00(s, \uC61B), \uC61B\uAF34: true };
  }
  async function \uC804\uCCB4\uC77D\uAE30(\uD45C3, \uCEEC\uB7FC, \uCD94\uAC00\uC870\uAC74 = "") {
    const r = await fetch(
      `${URL_}/rest/v1/${encodeURIComponent(\uD45C3)}?select=${\uCEEC\uB7FC.map(encodeURIComponent).join(",")}${\uCD94\uAC00\uC870\uAC74}`,
      { headers: { apikey: KEY_, Authorization: `Bearer ${KEY_}` } }
    );
    if (!r.ok) throw new Error(`${\uD45C3} \uC77D\uAE30 \uC2E4\uD328 ${r.status} ${await r.text()}`);
    return await r.json();
  }

  // ../../../../../../home/claude/webapp/supabase/functions/rpc/auth.ts
  async function AUTH_getHospitals() {
    const \uD589\uB4E4 = await \uC804\uCCB4\uC77D\uAE30("\uBCD1\uC6D0", ["\uBCD1\uC6D0ID", "\uBCD1\uC6D0\uBA85", "\uC0AC\uC6A9\uC5EC\uBD80"]);
    return \uD589\uB4E4.filter((r) => r["\uC0AC\uC6A9\uC5EC\uBD80"] !== false && String(r["\uC0AC\uC6A9\uC5EC\uBD80"]).toLowerCase() !== "false").map((r) => ({ \uBCD1\uC6D0ID: \uAE00(r["\uBCD1\uC6D0ID"]), \uBCD1\uC6D0\uBA85: \uAE00(r["\uBCD1\uC6D0\uBA85"]) })).sort((a, b) => a.\uBCD1\uC6D0ID.localeCompare(b.\uBCD1\uC6D0ID));
  }
  var \uC0AC\uC6A9\uC790\uCE78 = [
    "\uC0AC\uC6A9\uC790ID",
    "\uBCD1\uC6D0ID",
    "\uC544\uC774\uB514",
    "\uBE44\uBC00\uBC88\uD638\uD574\uC2DC",
    "\uC774\uB984",
    "\uAD8C\uD55C",
    "\uC0AC\uC6A9\uC5EC\uBD80",
    "\uBA54\uB274\uC81C\uD55C",
    "\uC218\uC815\uC81C\uD55C",
    "\uC138\uC158\uD0A4",
    "\uB9C8\uC9C0\uB9C9\uB85C\uADF8\uC778",
    "\uD654\uBA74\uC124\uC815",
    "\uC5F0\uACB0\uD0A4"
  ];
  var \uC5F0\uC7A5\uC0C1\uD55C\uCD08 = 15 * 3600;
  var \uBB36\uC74C\uCE78 = \uC0AC\uC6A9\uC790\uCE78.filter((k) => k !== "\uBE44\uBC00\uBC88\uD638\uD574\uC2DC");

  // ../../../../../../home/claude/webapp/supabase/functions/rpc/mkt.ts
  var URL_2 = Deno.env.get("SUPABASE_URL");
  var KEY_2 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  var \uC624\uB958 = (\uBB38\uAD6C, \uC0C1\uD0DC = 400) => Object.assign(new Error(\uBB38\uAD6C), { \uC0C1\uD0DC });
  async function \uB514\uBE44(\uD45C3, \uC870\uAC74 = {}, init = {}) {
    const \uCFFC\uB9AC = Object.entries(\uC870\uAC74).map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");
    const r = await fetch(`${URL_2}/rest/v1/${encodeURIComponent(\uD45C3)}${\uCFFC\uB9AC ? "?" + \uCFFC\uB9AC : ""}`, {
      ...init,
      headers: {
        apikey: KEY_2,
        Authorization: `Bearer ${KEY_2}`,
        "Content-Type": "application/json",
        ...init.headers || {}
      }
    });
    if (!r.ok) throw \uC624\uB958(`${\uD45C3} ${r.status} ${await r.text()}`, r.status === 409 ? 409 : 500);
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  }
  var \uC124\uC815\uC77D\uAE30 = async () => ({
    \uD1A0\uD070\uC138\uB300: "1",
    \uD68C\uC6D0\uAD8C\uD1A0\uD070\uC138\uB300: "1",
    ...Object.fromEntries((await \uB514\uBE44("\uC2DC\uBBAC\uC124\uC815", { select: "\uD0A4,\uAC12" })).map((r) => [\uAE00(r["\uD0A4"]), \uAE00(r["\uAC12"])]))
  });
  var \uC2DC\uBBAC\uD2C0 = {
    MKT: { \uBAA9\uC801: "marketing-sim", \uD574\uC2DC: "\uBE44\uBC00\uBC88\uD638\uD574\uC2DC", \uC138\uB300: "\uD1A0\uD070\uC138\uB300", \uCC98\uC74C: "\uCC98\uC74C\uD5C8\uC6A9" },
    MEM: { \uBAA9\uC801: "membership-sim", \uD574\uC2DC: "\uD68C\uC6D0\uAD8C\uBE44\uBC00\uBC88\uD638\uD574\uC2DC", \uC138\uB300: "\uD68C\uC6D0\uAD8C\uD1A0\uD070\uC138\uB300", \uCC98\uC74C: "\uD68C\uC6D0\uAD8C\uCC98\uC74C\uD5C8\uC6A9" }
  };
  async function \uC2DC\uBBAC\uBE44\uBC00(\uBE0C\uB9AC\uC9C0\uBE44\uBC00, \uBAA9\uC801) {
    const \uD0A4 = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(\uBE0C\uB9AC\uC9C0\uBE44\uBC00),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const \uC11C = new Uint8Array(await crypto.subtle.sign("HMAC", \uD0A4, new TextEncoder().encode(\uBAA9\uC801)));
    return [...\uC11C].map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  async function \uD1A0\uD070\uB9CC\uB4E4\uAE30(\uBE44\uBC00, \uC138\uB300) {
    const \uC9C0\uAE08 = Math.floor(Date.now() / 1e3);
    return \uC11C\uBA85({ \uC885\uB958: "sim", \uBCD1\uC6D0ID: "*", \uC138\uB300, iat: \uC9C0\uAE08, exp: \uC9C0\uAE08 + 30 * 86400 }, \uBE44\uBC00);
  }
  async function \uD1A0\uD070\uD655\uC778(\uD1A0\uD070, \uBE44\uBC00, \uC124, t) {
    let \uD074;
    try {
      \uD074 = await \uAC80\uC99D(\uD1A0\uD070, \uBE44\uBC00);
    } catch {
      throw \uC624\uB958("\uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.", 401);
    }
    if (\uD074["\uC885\uB958"] !== "sim" || \uAE00(\uD074["\uC138\uB300"]) !== \uC124[t.\uC138\uB300]) throw \uC624\uB958("\uB2E4\uC2DC \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.", 401);
  }
  function \uC544\uC774\uD53C(h) {
    const ip = (h.get("cf-connecting-ip") || (h.get("x-forwarded-for") || "").split(",")[0]).trim().toLowerCase() || "?";
    const v4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(ip);
    if (v4) return v4[1];
    if (!ip.includes(":")) return ip;
    const [\uC55E, \uB4A4 = ""] = ip.split("::");
    const a = \uC55E ? \uC55E.split(":") : [], b = \uB4A4 ? \uB4A4.split(":") : [];
    const \uC804\uBD80 = [...a, ...Array(Math.max(0, 8 - a.length - b.length)).fill("0"), ...b];
    return \uC804\uBD80.slice(0, 4).map((x) => x.replace(/^0+(?=.)/, "")).join(":") + "::/64";
  }
  async function \uBE44\uBC00\uBC88\uD638\uD655\uC778(\uD3C9\uBB38, \uD5E4\uB354, \uD574\uC2DC, \uBB34\uC5C7 = "\uBE44\uBC00\uBC88\uD638\uAC00") {
    const ip = \uC544\uC774\uD53C(\uD5E4\uB354);
    const [\uC904] = await \uB514\uBE44(
      "\uB9C8\uCF00\uD305\uB85C\uADF8\uC778\uC2E4\uD328",
      {},
      { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ ip }) }
    );
    const \uC9C0\uC6B0\uAE30 = () => \uB514\uBE44("\uB9C8\uCF00\uD305\uB85C\uADF8\uC778\uC2E4\uD328", { \uBC88\uD638: "eq." + \uAE00(\uC904["\uBC88\uD638"]) }, { method: "DELETE" }).catch(() => {
    });
    const \uCD5C\uADFC = await \uB514\uBE44(
      "\uB9C8\uCF00\uD305\uB85C\uADF8\uC778\uC2E4\uD328",
      { \uC2DC\uAC01: "gte." + new Date(Date.now() - 6e5).toISOString(), select: "ip", limit: "101" }
    );
    if (\uCD5C\uADFC.length > 100 || \uCD5C\uADFC.filter((r) => r["ip"] === ip).length > 5) {
      await \uC9C0\uC6B0\uAE30();
      throw \uC624\uB958("\uD2C0\uB9B0 \uC2DC\uB3C4\uAC00 \uB9CE\uC544 10\uBD84 \uB3D9\uC548 \uB9C9\uD614\uC2B5\uB2C8\uB2E4.", 429);
    }
    if (\uD3C9\uBB38.length > 200 || !(await \uBE44\uBC00\uBC88\uD638\uB9DE\uB098(\uD3C9\uBB38, \uD574\uC2DC)).\uB9DE\uC74C) throw \uC624\uB958(`${\uBB34\uC5C7} \uB9DE\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.`);
    await \uC9C0\uC6B0\uAE30();
  }
  var \uC0C8\uBE44\uBC88\uAC80\uC0AC = (s) => {
    if (s.length < 8 || s.length > 200) throw \uC624\uB958("\uBE44\uBC00\uBC88\uD638\uB294 8\uC790 \uC774\uC0C1\uC73C\uB85C \uC815\uD574 \uC8FC\uC138\uC694.");
  };
  async function \uBCD1\uC6D0\uD655\uC778(v) {
    const id = \uAE00(v).trim();
    const [h] = id ? await \uB514\uBE44("\uBCD1\uC6D0", { \uBCD1\uC6D0ID: "eq." + id, select: "\uBCD1\uC6D0ID,\uC0AC\uC6A9\uC5EC\uBD80" }) : [];
    if (!h || h["\uC0AC\uC6A9\uC5EC\uBD80"] === false) throw \uC624\uB958("\uC5C6\uB294 \uBCD1\uC6D0\uC785\uB2C8\uB2E4.");
    return h;
  }
  var \uB2EC\uB354\uD558\uAE30 = (\uC5F0\uC6D4, n) => {
    const [y, m] = \uC5F0\uC6D4.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7);
  };
  var \uD558\uB8E8\uC804 = (\uC77C) => new Date(Date.parse(\uC77C + "T00:00:00Z") - 864e5).toISOString().slice(0, 10);
  var \uC548\uBC88\uD638 = (v) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) throw \uC624\uB958("\uC5C6\uB294 \uC548\uC785\uB2C8\uB2E4.");
    return n;
  };
  async function \uB85C\uADF8\uC778(t, args, \uD5E4\uB354, \uBE44\uBC00) {
    const \uC124 = await \uC124\uC815\uC77D\uAE30();
    if (!\uC124[t.\uD574\uC2DC]) return { \uCC98\uC74C: true };
    await \uBE44\uBC00\uBC88\uD638\uD655\uC778(\uAE00(args[0]), \uD5E4\uB354, \uC124[t.\uD574\uC2DC]);
    await \uB514\uBE44(
      "\uB9C8\uCF00\uD305\uB85C\uADF8\uC778\uC2E4\uD328",
      { \uC2DC\uAC01: "lt." + new Date(Date.now() - 864e5).toISOString() },
      { method: "DELETE" }
    ).catch(() => {
    });
    return { \uD1A0\uD070: await \uD1A0\uD070\uB9CC\uB4E4\uAE30(\uBE44\uBC00, \uC124[t.\uC138\uB300]) };
  }
  async function \uBE44\uBC00\uBC88\uD638\uCC98\uC74C(t, args, _\uD5E4\uB354, \uBE44\uBC00) {
    const \uC0C8\uAC83 = \uAE00(args[0]);
    \uC0C8\uBE44\uBC88\uAC80\uC0AC(\uC0C8\uAC83);
    const \uC124 = await \uC124\uC815\uC77D\uAE30();
    if (\uC124[t.\uD574\uC2DC]) throw \uC624\uB958("\uC774\uBBF8 \uC815\uD574\uC838 \uC788\uC2B5\uB2C8\uB2E4. \uB85C\uADF8\uC778\uD574 \uC8FC\uC138\uC694.", 409);
    if (\uC124[t.\uCC98\uC74C] !== "1") throw \uC624\uB958("\uC9C0\uAE08\uC740 \uBE44\uBC00\uBC88\uD638\uB97C \uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 403);
    await \uB514\uBE44("\uC2DC\uBBAC\uC124\uC815", {}, { method: "POST", body: JSON.stringify({ \uD0A4: t.\uD574\uC2DC, \uAC12: await \uBE44\uBC00\uBC88\uD638\uB9CC\uB4E4\uAE30(\uC0C8\uAC83) }) });
    await \uB514\uBE44("\uC2DC\uBBAC\uC124\uC815", { \uD0A4: "eq." + t.\uCC98\uC74C }, { method: "DELETE" });
    return { \uD1A0\uD070: await \uD1A0\uD070\uB9CC\uB4E4\uAE30(\uBE44\uBC00, \uC124[t.\uC138\uB300]) };
  }
  var PIN = { \uD574\uC2DC: "\uB9C8\uC2A4\uD130PIN\uD574\uC2DC", \uCC98\uC74C: "\uB9C8\uC2A4\uD130PIN\uCC98\uC74C\uD5C8\uC6A9" };
  async function \uB9C8\uC2A4\uD130PIN\uCC98\uC74C(_t, args) {
    const pin = \uAE00(args[0]);
    if (pin.length < 6 || pin.length > 200) throw \uC624\uB958("\uB9C8\uC2A4\uD130 PIN \uC740 6\uC790 \uC774\uC0C1\uC73C\uB85C \uC815\uD574 \uC8FC\uC138\uC694.");
    const \uC124 = await \uC124\uC815\uC77D\uAE30();
    if (\uC124[PIN.\uD574\uC2DC]) throw \uC624\uB958("\uB9C8\uC2A4\uD130 PIN \uC774 \uC774\uBBF8 \uC815\uD574\uC838 \uC788\uC2B5\uB2C8\uB2E4.", 409);
    if (\uC124[PIN.\uCC98\uC74C] !== "1") throw \uC624\uB958("\uC9C0\uAE08\uC740 \uB9C8\uC2A4\uD130 PIN \uC744 \uC815\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", 403);
    await \uB514\uBE44("\uC2DC\uBBAC\uC124\uC815", {}, { method: "POST", body: JSON.stringify({ \uD0A4: PIN.\uD574\uC2DC, \uAC12: await \uBE44\uBC00\uBC88\uD638\uB9CC\uB4E4\uAE30(pin) }) });
    await \uB514\uBE44("\uC2DC\uBBAC\uC124\uC815", { \uD0A4: "eq." + PIN.\uCC98\uC74C }, { method: "DELETE" });
    return { \uB428: true };
  }
  async function \uBE44\uBC00\uBC88\uD638\uBC14\uAFB8\uAE30(t, args, \uD5E4\uB354, \uBE44\uBC00) {
    const \uC0C8\uAC83 = \uAE00(args[1]);
    \uC0C8\uBE44\uBC88\uAC80\uC0AC(\uC0C8\uAC83);
    const \uC124 = await \uC124\uC815\uC77D\uAE30();
    if (!\uC124[PIN.\uD574\uC2DC]) return { \uCC98\uC74C: true };
    await \uBE44\uBC00\uBC88\uD638\uD655\uC778(\uAE00(args[0]), \uD5E4\uB354, \uC124[PIN.\uD574\uC2DC], "\uB9C8\uC2A4\uD130 PIN \uC774");
    const \uC138\uB300 = String((Number(\uC124[t.\uC138\uB300]) || 1) + 1);
    await \uB514\uBE44("\uC2DC\uBBAC\uC124\uC815", {}, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{ \uD0A4: t.\uD574\uC2DC, \uAC12: await \uBE44\uBC00\uBC88\uD638\uB9CC\uB4E4\uAE30(\uC0C8\uAC83) }, { \uD0A4: t.\uC138\uB300, \uAC12: \uC138\uB300 }])
    });
    return { \uD1A0\uD070: await \uD1A0\uD070\uB9CC\uB4E4\uAE30(\uBE44\uBC00, \uC138\uB300) };
  }
  async function MKT_\uBCD1\uC6D0\uBAA9\uB85D() {
    return (await AUTH_getHospitals()).sort((a, b) => a.\uBCD1\uC6D0ID.localeCompare(b.\uBCD1\uC6D0ID));
  }
  async function MKT_\uC9D1\uACC4(args) {
    const id = \uAE00((await \uBCD1\uC6D0\uD655\uC778(args[0]))["\uBCD1\uC6D0ID"]);
    const \uC624\uB2982 = \uC624\uB298KST(), \uC2DC\uC791 = \uB2EC\uB354\uD558\uAE30(\uC624\uB2982.slice(0, 7), -12) + "-01";
    const [\uB2EC, \uAE30\uC900] = await Promise.all([
      \uC9C8\uC758("mkt_month_total", { p_hosp: id, p_from: \uC2DC\uC791, p_to: \uD558\uB8E8\uC804(\uC624\uB2982) }),
      \uB514\uBE44("\uAE30\uC900\uC815\uBCF4", { \uBCD1\uC6D0ID: "eq." + id, \uAD6C\uBD84: "eq.\uC6D4\uBAA9\uD45C", \uC0AC\uC6A9\uC5EC\uBD80: "is.true", select: "\uAC12,\uBE44\uACE0", order: "\uAE30\uC900ID.asc" })
    ]);
    const \uBAA9\uD45C2 = {};
    for (const r of \uAE30\uC900) {
      const \uB2EC\uD0A4 = \uAE00(r["\uAC12"]).trim();
      if (!Object.hasOwn(\uBAA9\uD45C2, \uB2EC\uD0A4)) \uBAA9\uD45C2[\uB2EC\uD0A4] = Number(\uAE00(r["\uBE44\uACE0"]).replace(/,/g, "")) || 0;
    }
    return {
      \uC624\uB298: \uC624\uB2982,
      \uB2EC: \uB2EC.map((r) => ({ \uC5F0\uC6D4: \uAE00(r["\uC5F0\uC6D4"]), \uC0C1\uB2F4: Number(r["\uC0C1\uB2F4"]), \uACB0\uC81C: Number(r["\uACB0\uC81C"]), \uB9E4\uCD9C: Number(r["\uB9E4\uCD9C"]) })),
      \uBAA9\uD45C: \uBAA9\uD45C2
    };
  }
  async function MKT_\uC548\uBAA9\uB85D(args) {
    const \uBCD1\uC6D0 = await \uBCD1\uC6D0\uD655\uC778(args[0]);
    return \uB514\uBE44("\uB9C8\uCF00\uD305\uC548", { \uBCD1\uC6D0ID: "eq." + \uAE00(\uBCD1\uC6D0["\uBCD1\uC6D0ID"]), select: "\uC548ID,\uC774\uB984,\uAC12,\uC218\uC815\uC77C\uC2DC", order: "\uC548ID.asc" });
  }
  var \uC218 = (v) => {
    const n = Number(\uAE00(v).replace(/,/g, ""));
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  var \uBB3C\uAC74 = (v) => v && typeof v === "object" ? v : {};
  var \uAE30\uC900\uCE78 = ["\uB9E4\uCD9C", "\uC0C1\uB2F4", "\uB9C8\uCF00\uD305\uBE44", "\uC544\uC6C3DB", "\uC778DB", "\uCD94\uAC00DB", "CPA", "\uC544\uC6C3\uB960", "\uC778\uB960", "\uC6D0\uB0B4", "\uB2E8\uAC00", "\uC601\uC5C5\uC77C"];
  function \uC548\uAC12(v) {
    const a = \uBB3C\uAC74(v), t = \uBB3C\uAC74(a["\uC804\uD658"]), c = \uBB3C\uAC74(a["\uC0C1\uB2F4"]);
    const \uB2EC = \uAE00(a["\uB2EC"]), \uAE30\uC900 = a["\uAE30\uC900"], \uB2EC\uAF34 = typeof a["\uB2EC"] === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(\uB2EC) ? \uB2EC : "";
    if (a["\uC885\uB958"] === "\uAE30\uC900") {
      const g = \uBB3C\uAC74(a["\uAE30\uC900\uAC12"]);
      return { \uC885\uB958: "\uAE30\uC900", \uB2EC: \uB2EC\uAF34, \uBA54\uBAA8: "", \uC0AC\uC6A9: a["\uC0AC\uC6A9"] === true, \uAE30\uC900\uAC12: Object.fromEntries(\uAE30\uC900\uCE78.map((k) => [k, \uC218(g[k])])) };
    }
    return {
      \uC885\uB958: a["\uC885\uB958"] === "\uC2E4\uC801" ? "\uC2E4\uC801" : "\uACC4\uD68D",
      \uB2EC: \uB2EC\uAF34,
      \uAE30\uC900: Number.isInteger(\uAE30\uC900) && \uAE30\uC900 > 0 ? \uAE30\uC900 : null,
      \uBA54\uBAA8: \uAE00(a["\uBA54\uBAA8"]).trim().slice(0, 30),
      \uC601\uC5C5\uC77C: \uC218(a["\uC601\uC5C5\uC77C"]),
      \uC2DC\uC220: \uC218(a["\uC2DC\uC220"]),
      \uC678: \uC218(a["\uC678"]),
      \uD56D\uBAA9: (Array.isArray(a["\uD56D\uBAA9"]) ? a["\uD56D\uBAA9"] : []).filter((x) => x && typeof x === "object").slice(0, 50).map(\uC904\uAC12),
      \uC778DB: \uC218(a["\uC778DB"]),
      \uCD94\uAC00DB: \uC218(a["\uCD94\uAC00DB"]),
      \uC0C1\uB2F4: { \uC544\uC6C3: \uC218(c["\uC544\uC6C3"]), \uC778: \uC218(c["\uC778"]), \uC6D0\uB0B4: \uC218(c["\uC6D0\uB0B4"]) },
      \uC804\uD658: { \uC544\uC6C3\uB960: \uC218(t["\uC544\uC6C3\uB960"]), \uC778\uB960: \uC218(t["\uC778\uB960"]), \uC6D0\uB0B4: \uC218(t["\uC6D0\uB0B4"]), \uB2E8\uAC00: \uC218(t["\uB2E8\uAC00"]), \uAE30\uC900\uC77C: \uC218(t["\uAE30\uC900\uC77C"]) }
    };
  }
  var \uC14B\uCE78 = ["\uAE08\uC561", "db", "cpa"];
  function \uC904\uAC12(x) {
    const \uC774\uB984 = \uAE00(x["\uC774\uB984"]).trim().slice(0, 30) || "\uC774\uB984 \uC5C6\uC74C", \uAE08\uC561 = \uC218(x["\uAE08\uC561"]), cpa = \uC218(x["cpa"]);
    const DB = x["\uC885\uB958"] === "DB" || x["\uC885\uB958"] !== "\uADF8\uBC16" && cpa > 0;
    if (!DB) return { \uC774\uB984, \uC885\uB958: "\uADF8\uBC16", \uAE08\uC561, db: 0, cpa: null, \uC148\uCE78: "db" };
    const \uC904 = { \uC774\uB984, \uC885\uB958: "DB", \uAE08\uC561, db: \uC218(x["db"]), cpa, \uC148\uCE78: \uC14B\uCE78.includes(\uAE00(x["\uC148\uCE78"])) ? \uAE00(x["\uC148\uCE78"]) : "db" };
    if (\uC904.\uC148\uCE78 === "cpa") \uC904.cpa = \uC904.db > 0 ? \uC904.\uAE08\uC561 / \uC904.db : 0;
    else if (\uC904.\uC148\uCE78 === "\uAE08\uC561") \uC904.\uAE08\uC561 = Math.round(\uC904.db * \uC904.cpa);
    else \uC904.db = \uC904.cpa > 0 ? Math.floor(\uC904.\uAE08\uC561 / \uC904.cpa) : \uC904.db;
    return \uC904;
  }
  async function MKT_\uC548\uC800\uC7A5(args) {
    const \uBCD1\uC6D0ID = \uAE00((await \uBCD1\uC6D0\uD655\uC778(args[0]))["\uBCD1\uC6D0ID"]);
    const \uC774\uB984 = \uAE00(args[2]).trim().slice(0, 20);
    if (!\uC774\uB984) throw \uC624\uB958("\uC548 \uC774\uB984\uC744 \uB123\uC5B4 \uC8FC\uC138\uC694.");
    const \uAC12 = \uC548\uAC12(args[3]), \uC218\uC815\uC77C\uC2DC = (/* @__PURE__ */ new Date()).toISOString();
    if (args[1] == null) {
      return { \uC548ID: Number((await \uC0BD\uC785("\uB9C8\uCF00\uD305\uC548", { \uBCD1\uC6D0ID, \uC774\uB984, \uAC12, \uC218\uC815\uC77C\uC2DC }))["\uC548ID"]) };
    }
    const \uC548ID = \uC548\uBC88\uD638(args[1]);
    if (!(await \uAC31\uC2E0("\uB9C8\uCF00\uD305\uC548", { \uC548ID: String(\uC548ID), \uBCD1\uC6D0ID }, { \uC774\uB984, \uAC12, \uC218\uC815\uC77C\uC2DC })).length) throw \uC624\uB958("\uC5C6\uB294 \uC548\uC785\uB2C8\uB2E4.");
    return { \uC548ID };
  }
  async function MKT_\uC548\uC0AD\uC81C(args) {
    const \uBCD1\uC6D0ID = \uAE00((await \uBCD1\uC6D0\uD655\uC778(args[0]))["\uBCD1\uC6D0ID"]);
    const \uC9C0\uC6B4 = await \uB514\uBE44(
      "\uB9C8\uCF00\uD305\uC548",
      { \uC548ID: "eq." + \uC548\uBC88\uD638(args[1]), \uBCD1\uC6D0ID: "eq." + \uBCD1\uC6D0ID },
      { method: "DELETE", headers: { Prefer: "return=representation" } }
    );
    if (!\uC9C0\uC6B4.length) throw \uC624\uB958("\uC5C6\uB294 \uC548\uC785\uB2C8\uB2E4.");
    return { ok: true };
  }
  var \uC2DC\uB098\uB9AC\uC624\uBC88\uD638 = (v) => {
    const id = \uAE00(v);
    if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw \uC624\uB958("\uC5C6\uB294 \uC2DC\uB098\uB9AC\uC624\uC785\uB2C8\uB2E4.");
    return id;
  };
  var \uBB3C\uAC74\uC778\uAC00 = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  async function MEM_\uAE30\uBCF8\uC2DC\uC220(_args, _\uD5E4\uB354, _\uBE44\uBC00, \uC124) {
    try {
      return JSON.parse(\uC124["\uD68C\uC6D0\uAD8C\uAE30\uBCF8\uC2DC\uC220"] || "");
    } catch {
      return { \uC2DC\uC220: [], \uAD6C\uC6D4\uC804\uCCB4: 0 };
    }
  }
  async function MEM_\uC2DC\uB098\uB9AC\uC624\uBAA9\uB85D() {
    const \uC904 = await \uB514\uBE44("\uD68C\uC6D0\uAD8C\uC2DC\uB098\uB9AC\uC624", { select: "\uC2DC\uB098\uB9AC\uC624ID,\uC774\uB984,params,items,\uC218\uC815\uC77C\uC2DC" });
    return \uC904.sort((a, b) => \uAE00(b["\uC218\uC815\uC77C\uC2DC"]).localeCompare(\uAE00(a["\uC218\uC815\uC77C\uC2DC"]))).map((r) => ({ id: r["\uC2DC\uB098\uB9AC\uC624ID"], name: r["\uC774\uB984"], params: r["params"], items: r["items"], updated_at: r["\uC218\uC815\uC77C\uC2DC"] }));
  }
  async function MEM_\uC2DC\uB098\uB9AC\uC624\uC800\uC7A5(args) {
    const id = \uC2DC\uB098\uB9AC\uC624\uBC88\uD638(args[0]), \uC774\uB984 = \uAE00(args[1]).trim(), params = args[2], items = args[3];
    if (!\uC774\uB984 || \uC774\uB984.length > 60) throw \uC624\uB958("\uC774\uB984\uC740 1~60\uC790\uB85C \uC801\uC5B4 \uC8FC\uC138\uC694.");
    if (!\uBB3C\uAC74\uC778\uAC00(params)) throw \uC624\uB958("params \uAC00 \uAC1D\uCCB4\uAC00 \uC544\uB2D9\uB2C8\uB2E4.");
    if (!Array.isArray(items) || items.length > 200 || !items.every(\uBB3C\uAC74\uC778\uAC00)) throw \uC624\uB958("items \uB294 \uAC1D\uCCB4 200\uAC1C \uC774\uD558\uC758 \uBC30\uC5F4\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4.");
    if (JSON.stringify([params, items]).length > 256 * 1024) throw \uC624\uB958("\uC800\uC7A5\uD560 \uB0B4\uC6A9\uC774 \uB108\uBB34 \uD07D\uB2C8\uB2E4.", 413);
    const updated_at = (/* @__PURE__ */ new Date()).toISOString();
    await \uB514\uBE44("\uD68C\uC6D0\uAD8C\uC2DC\uB098\uB9AC\uC624", {}, {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ \uC2DC\uB098\uB9AC\uC624ID: id, \uC774\uB984, params, items, \uC218\uC815\uC77C\uC2DC: updated_at })
    });
    return { updated_at };
  }
  async function MEM_\uC2DC\uB098\uB9AC\uC624\uC0AD\uC81C(args) {
    await \uB514\uBE44("\uD68C\uC6D0\uAD8C\uC2DC\uB098\uB9AC\uC624", { \uC2DC\uB098\uB9AC\uC624ID: "eq." + \uC2DC\uB098\uB9AC\uC624\uBC88\uD638(args[0]) }, { method: "DELETE" });
    return { ok: true };
  }
  var \uACF5\uAC1C = {
    MKT_login: \uB85C\uADF8\uC778,
    MKT_\uBE44\uBC00\uBC88\uD638\uCC98\uC74C: \uBE44\uBC00\uBC88\uD638\uCC98\uC74C,
    MKT_\uBE44\uBC00\uBC88\uD638\uBC14\uAFB8\uAE30: \uBE44\uBC00\uBC88\uD638\uBC14\uAFB8\uAE30,
    MKT_\uB9C8\uC2A4\uD130PIN\uCC98\uC74C: \uB9C8\uC2A4\uD130PIN\uCC98\uC74C,
    MEM_login: \uB85C\uADF8\uC778,
    MEM_\uBE44\uBC00\uBC88\uD638\uCC98\uC74C: \uBE44\uBC00\uBC88\uD638\uCC98\uC74C,
    MEM_\uBE44\uBC00\uBC88\uD638\uBC14\uAFB8\uAE30: \uBE44\uBC00\uBC88\uD638\uBC14\uAFB8\uAE30,
    MEM_\uB9C8\uC2A4\uD130PIN\uCC98\uC74C: \uB9C8\uC2A4\uD130PIN\uCC98\uC74C
  };
  var \uC7A0\uAE34 = {
    MKT_\uBCD1\uC6D0\uBAA9\uB85D,
    MKT_\uC9D1\uACC4,
    MKT_\uC548\uBAA9\uB85D,
    MKT_\uC548\uC800\uC7A5,
    MKT_\uC548\uC0AD\uC81C,
    MEM_\uAE30\uBCF8\uC2DC\uC220,
    MEM_\uC2DC\uB098\uB9AC\uC624\uBAA9\uB85D,
    MEM_\uC2DC\uB098\uB9AC\uC624\uC800\uC7A5,
    MEM_\uC2DC\uB098\uB9AC\uC624\uC0AD\uC81C
  };
  async function \uC2DC\uBBAC\uBD80\uB974\uAE30(fn, args, \uD5E4\uB354, \uBE0C\uB9AC\uC9C0\uBE44\uBC00) {
    const t = Object.hasOwn(\uC2DC\uBBAC\uD2C0, fn.slice(0, 3)) && fn[3] === "_" ? \uC2DC\uBBAC\uD2C0[fn.slice(0, 3)] : null;
    if (!t) throw \uC624\uB958("\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uD568\uC218: " + fn);
    const \uBE44\uBC00 = await \uC2DC\uBBAC\uBE44\uBC00(\uBE0C\uB9AC\uC9C0\uBE44\uBC00, t.\uBAA9\uC801);
    if (Object.hasOwn(\uACF5\uAC1C, fn)) return \uACF5\uAC1C[fn](t, args, \uD5E4\uB354, \uBE44\uBC00);
    if (!Object.hasOwn(\uC7A0\uAE34, fn)) throw \uC624\uB958("\uD5C8\uC6A9\uB418\uC9C0 \uC54A\uC740 \uD568\uC218: " + fn);
    const \uC124 = await \uC124\uC815\uC77D\uAE30();
    await \uD1A0\uD070\uD655\uC778(\uD5E4\uB354.get("x-sim-token") || "", \uBE44\uBC00, \uC124, t);
    return \uC7A0\uAE34[fn](args, \uD5E4\uB354, \uBE44\uBC00, \uC124, t);
  }

  // shim.mjs
  var \uC9C4\uC9DCfetch = window.fetch.bind(window);
  var \uD45C2 = \uD45C();
  var \uB514\uBE442 = \uAC00\uC9DC\uB514\uBE44(\uD45C2, rpc);
  var RPC = "https://koulrgvigntnqpwgpgzt.supabase.co/functions/v1/rpc";
  Date.now = () => Date.parse(\uC624\uB298 + "T12:00:00+09:00");
  var \uC900\uBE44 = Promise.all(["\uBE44\uBC00\uBC88\uD638\uD574\uC2DC", "\uD68C\uC6D0\uAD8C\uBE44\uBC00\uBC88\uD638\uD574\uC2DC"].map(async (\uD0A4) => \uD45C2.\uC2DC\uBBAC\uC124\uC815.push({ \uD0A4, \uAC12: await \uBE44\uBC00\uBC88\uD638\uB9CC\uB4E4\uAE30("demo") })));
  window.fetch = async (\uC8FC\uC18C, opt = {}) => {
    const u = String(\uC8FC\uC18C);
    if (u.startsWith("http://db.test")) return \uB514\uBE442(u, opt);
    if (u !== RPC && !u.endsWith("/rpc")) return \uC9C4\uC9DCfetch(\uC8FC\uC18C, opt);
    await \uC900\uBE44;
    try {
      const { fn = "", args = [] } = JSON.parse(opt.body || "{}");
      const \uD5E4\uB354 = new Headers(opt.headers);
      return new Response(JSON.stringify({ ok: await \uC2DC\uBBAC\uBD80\uB974\uAE30(String(fn), args, \uD5E4\uB354, "demo-bridge") }), { status: 200 });
    } catch (e) {
      return new Response(JSON.stringify({ err: e.message }), { status: e.\uC0C1\uD0DC || 400 });
    }
  };
  addEventListener("DOMContentLoaded", () => {
    const \uB760 = document.createElement("div");
    \uB760.textContent = "\uACF5\uAC1C \uB370\uBAA8 \xB7 \uC22B\uC790\uB294 \uBAA8\uB450 \uC5F0\uC2B5\uC6A9 \uC784\uC758 \uAC12 \xB7 \uBE44\uBC00\uBC88\uD638 demo";
    \uB760.style.cssText = "position:fixed;left:50%;bottom:10px;transform:translateX(-50%);z-index:9999;background:#1f1f22;color:#fff;font:13px/1.4 sans-serif;padding:6px 12px;border-radius:999px;pointer-events:none";
    document.body.append(\uB760);
  });
})();
